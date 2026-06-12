#!/usr/bin/env python3
"""
Seed the Inbox with recent lens-matching projects so the app demos before the
daily engine is built. The engine (built last) generates these for real; this is
a one-off backfill of the most recent matched filings.

Idempotent: clears prior rule-generated items (keeps @mention items) and reseeds.

Usage:
    set -a; source .env; set +a
    python3 scripts/seed_inbox.py [--limit 80]
"""
import argparse
import os
import sys

import psycopg2


def bullets(type_of_work, sqft, city, status):
    out = []
    bits = []
    if type_of_work:
        bits.append(type_of_work)
    if sqft:
        bits.append(f"{sqft:,} sqft")
    if city:
        bits.append(city)
    if bits:
        out.append(" · ".join(bits))
    out.append("Matched the Elite fitness lens")
    if status and status != "Project Registered":
        out.append(f"Current status: {status}")
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=80)
    args = ap.parse_args()

    url = os.environ.get("DATABASE_URL")
    if not url:
        sys.exit("DATABASE_URL not set (run: set -a; source .env; set +a)")
    pg = psycopg2.connect(url)
    cur = pg.cursor()

    cur.execute("select id from workspaces where slug='elite'")
    row = cur.fetchone()
    if not row:
        sys.exit("elite workspace not found")
    wsid = row[0]

    # clear prior rule-generated items, keep @mentions
    cur.execute(
        "delete from inbox_items where workspace_id=%s and reason <> 'mention'",
        (wsid,),
    )

    cur.execute(
        """
        select p.project_number, p.type_of_work, p.square_footage,
               p.location_city, p.current_status
        from workspace_matches m
        join projects p on p.project_number = m.project_number
        where m.workspace_id = %s
        order by p.registration_date desc nulls last, p.project_number desc
        limit %s
        """,
        (wsid, args.limit),
    )
    rows = cur.fetchall()

    for pn, tow, sqft, city, status in rows:
        cur.execute(
            """insert into inbox_items
               (workspace_id, project_number, reason, reason_bullets, state)
               values (%s, %s, 'new_project', %s, 'new')""",
            (wsid, pn, bullets(tow, sqft, city, status)),
        )
    pg.commit()
    cur.execute("select count(*) from inbox_items where workspace_id=%s and state='new'", (wsid,))
    print(f"seeded {cur.fetchone()[0]} new inbox items for workspace {wsid}")
    pg.close()


if __name__ == "__main__":
    main()
