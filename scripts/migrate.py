#!/usr/bin/env python3
"""
Minimal, pro-grade migration runner for Supabase/Postgres.

Applies any not-yet-applied *.sql files in supabase/migrations/ (in filename
order) to the database in $DATABASE_URL, recording each in a schema_migrations
table so it's idempotent and reproducible. Compatible with the Supabase CLI
folder layout, so we can adopt `supabase db push` later with no changes.

Usage:
    set -a; source .env; set +a
    python3 scripts/migrate.py            # apply pending
    python3 scripts/migrate.py --status   # show applied vs pending
"""
import glob
import hashlib
import os
import sys

import psycopg2

MIG_DIR = "supabase/migrations"


def conn():
    url = os.environ.get("DATABASE_URL")
    if not url:
        sys.exit("DATABASE_URL not set (run: set -a; source .env; set +a)")
    return psycopg2.connect(url)


def ensure_table(cur):
    cur.execute(
        """create table if not exists schema_migrations(
             version text primary key,
             checksum text,
             applied_at timestamptz not null default now())"""
    )


def main():
    status_only = "--status" in sys.argv
    c = conn()
    c.autocommit = False
    cur = c.cursor()
    ensure_table(cur)
    c.commit()

    cur.execute("select version, checksum from schema_migrations")
    applied = {v: ck for v, ck in cur.fetchall()}
    files = sorted(glob.glob(f"{MIG_DIR}/*.sql"))
    if not files:
        sys.exit(f"no migrations found in {MIG_DIR}/")

    pending = []
    for f in files:
        ver = os.path.basename(f)
        sql = open(f).read()
        chk = hashlib.sha256(sql.encode()).hexdigest()[:12]
        state = "applied" if ver in applied else "PENDING"
        if ver in applied and applied[ver] != chk:
            state = "CHANGED (already applied with different content!)"
        print(f"  {state:10}  {ver}")
        if ver not in applied:
            pending.append((ver, sql, chk))

    if status_only:
        return
    if not pending:
        print("\nNothing to apply — schema up to date.")
        return

    print()
    for ver, sql, chk in pending:
        print(f"applying {ver} ...", end=" ", flush=True)
        try:
            cur.execute(sql)
            cur.execute(
                "insert into schema_migrations(version, checksum) values (%s, %s)",
                (ver, chk),
            )
            c.commit()
            print("ok")
        except Exception as e:
            c.rollback()
            sys.exit(f"\nFAILED on {ver}: {e}")
    print(f"\nDone — applied {len(pending)} migration(s).")


if __name__ == "__main__":
    main()
