#!/usr/bin/env python3
"""
Apply each workspace's lens to the projects and refresh workspace_matches.

Reads the include/exclude keyword lists from workspaces.lens (DB config — not
hardcoded, so the core stays tenant-agnostic) and tags every project whose text
(name / facility / scope / tenant) contains an include keyword and no exclude
keyword. The daily engine calls this same logic going forward.

Idempotent: rebuilds the match set for each workspace each run.

Usage:
    set -a; source .env; set +a
    python3 scripts/apply_lens.py
"""
import os
import sys

import psycopg2


def main():
    url = os.environ.get("DATABASE_URL")
    if not url:
        sys.exit("DATABASE_URL not set (run: set -a; source .env; set +a)")
    pg = psycopg2.connect(url)
    pg.autocommit = False
    cur = pg.cursor()

    cur.execute("select id, slug, lens from workspaces")
    workspaces = cur.fetchall()
    if not workspaces:
        sys.exit("no workspaces found")

    for wsid, slug, lens in workspaces:
        inc = [k.lower() for k in (lens or {}).get("include_keywords", [])]
        exc = [k.lower() for k in (lens or {}).get("exclude_keywords", [])]
        if not inc:
            print(f"[{slug}] no include keywords — skipped")
            continue

        cur.execute("delete from workspace_matches where workspace_id = %s", (wsid,))
        cur.execute(
            """
            with h as (
              select project_number,
                     lower(concat_ws(' ', project_name, facility_name,
                                          scope_of_work, tenant_name)) as hay
              from projects
            )
            insert into workspace_matches (workspace_id, project_number)
            select %(ws)s, project_number
            from h
            where (select bool_or(hay like '%%' || kw || '%%')
                     from unnest(%(inc)s::text[]) kw)
              and not (select bool_or(hay like '%%' || kw || '%%')
                         from unnest(%(exc)s::text[]) kw)
            on conflict do nothing
            """,
            {"ws": wsid, "inc": inc, "exc": exc},
        )
        pg.commit()
        cur.execute("select count(*) from workspace_matches where workspace_id = %s", (wsid,))
        print(f"[{slug}] matched {cur.fetchone()[0]:,} projects "
              f"({len(inc)} include / {len(exc)} exclude keywords)")

    pg.close()


if __name__ == "__main__":
    main()
