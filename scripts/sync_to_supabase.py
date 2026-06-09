#!/usr/bin/env python3
"""
Sync scraped projects from local SQLite (data/tabs.db) into Supabase Postgres.

- Idempotent UPSERT keyed on project_number (re-running is safe).
- Type conversions: dates (M/D/YYYY -> date), cost/sqft -> numeric, Yes/No -> bool,
  empty strings -> NULL.
- Logs status changes into status_history (new project => NULL->status;
  changed status => old->new). last_changed_at bumps only when raw_hash changes.

Usage:
    set -a; source .env; set +a
    python3 scripts/sync_to_supabase.py                # all local projects
    python3 scripts/sync_to_supabase.py --years 2026   # one FY (supports 2021-2026)
"""
import argparse
import os
import sqlite3
import sys
from datetime import datetime

import psycopg2
from psycopg2.extras import execute_values

SQLITE = "data/tabs.db"

# Supabase column order for the upsert. SQLite source field in comments where renamed.
COLNAMES = [
    "project_number", "registration_date", "project_name", "facility_name",
    "location_full", "location_city", "location_state", "location_zip", "location_county",
    "start_date", "completion_date", "estimated_cost",  # <- estimated_cost_num
    "type_of_work", "type_of_funds", "scope_of_work",
    "square_footage",  # <- square_footage_num
    "tenant_private_funds", "current_status", "filer_contact_name",
    "ras_name", "ras_number", "ras_address", "ras_phone",
    "owner_name", "owner_address", "owner_phone", "owner_contact_name",
    "tenant_name", "tenant_phone",
    "design_firm_name", "design_firm_address", "design_firm_phone", "raw_hash",
]
UPDATE_COLS = [c for c in COLNAMES if c != "project_number"]


def pdate(s):
    s = (s or "").strip()
    if not s:
        return None
    for fmt in ("%m/%d/%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            pass
    return None


def pbool(s):
    s = (s or "").strip().lower()
    return True if s == "yes" else False if s == "no" else None


def nz(v):
    if isinstance(v, str):
        v = v.strip()
    return v or None


def transform(r):
    return (
        r["project_number"],
        pdate(r["registration_date"]),
        nz(r["project_name"]), nz(r["facility_name"]),
        nz(r["location_full"]), nz(r["location_city"]), nz(r["location_state"]),
        nz(r["location_zip"]), nz(r["location_county"]),
        pdate(r["start_date"]), pdate(r["completion_date"]),
        r["estimated_cost_num"],
        nz(r["type_of_work"]), nz(r["type_of_funds"]), nz(r["scope_of_work"]),
        r["square_footage_num"],
        pbool(r["tenant_private_funds"]),
        nz(r["current_status"]), nz(r["filer_contact_name"]),
        nz(r["ras_name"]), nz(r["ras_number"]), nz(r["ras_address"]), nz(r["ras_phone"]),
        nz(r["owner_name"]), nz(r["owner_address"]), nz(r["owner_phone"]), nz(r["owner_contact_name"]),
        nz(r["tenant_name"]), nz(r["tenant_phone"]),
        nz(r["design_firm_name"]), nz(r["design_firm_address"]), nz(r["design_firm_phone"]),
        nz(r["raw_hash"]),
    )


def years_list(spec):
    out = []
    for part in spec.split(","):
        part = part.strip()
        if "-" in part:
            a, b = part.split("-")
            out += [str(y) for y in range(int(a), int(b) + 1)]
        elif part:
            out.append(part)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--years", default=None, help="e.g. 2026 or 2021-2026 (default: all)")
    ap.add_argument("--db", default=SQLITE)
    ap.add_argument("--batch", type=int, default=500)
    args = ap.parse_args()

    if not os.path.exists(args.db):
        sys.exit(f"no sqlite db at {args.db}")
    url = os.environ.get("DATABASE_URL")
    if not url:
        sys.exit("DATABASE_URL not set (run: set -a; source .env; set +a)")

    s = sqlite3.connect(args.db)
    s.row_factory = sqlite3.Row
    q, params = "SELECT * FROM projects", ()
    if args.years:
        yrs = years_list(args.years)
        q += " WHERE " + " OR ".join(["project_number LIKE ?"] * len(yrs))
        params = tuple(f"TABS{y}%" for y in yrs)
    rows = [dict(r) for r in s.execute(q, params)]
    print(f"local rows to sync: {len(rows):,}")
    if not rows:
        return

    pg = psycopg2.connect(url)
    pg.autocommit = False
    cur = pg.cursor()

    set_clause = ", ".join(f"{c}=EXCLUDED.{c}" for c in UPDATE_COLS)
    upsert_sql = (
        f"INSERT INTO projects ({','.join(COLNAMES)}) VALUES %s "
        f"ON CONFLICT (project_number) DO UPDATE SET {set_clause}, "
        f"last_seen_at=now(), "
        f"last_changed_at = CASE WHEN projects.raw_hash IS DISTINCT FROM EXCLUDED.raw_hash "
        f"THEN now() ELSE projects.last_changed_at END"
    )

    total = events = 0
    for i in range(0, len(rows), args.batch):
        chunk = rows[i:i + args.batch]
        pns = [r["project_number"] for r in chunk]
        cur.execute(
            "SELECT project_number, current_status FROM projects WHERE project_number = ANY(%s)",
            (pns,),
        )
        existing = dict(cur.fetchall())
        hrows = []
        for r in chunk:
            pn = r["project_number"]
            new = (r["current_status"] or "").strip() or None
            if pn not in existing:
                hrows.append((pn, None, new))
            elif (existing[pn] or None) != new:
                hrows.append((pn, existing[pn], new))
        execute_values(cur, upsert_sql, [transform(r) for r in chunk])
        if hrows:
            execute_values(
                cur,
                "INSERT INTO status_history(project_number, old_status, new_status) VALUES %s",
                hrows,
            )
            events += len(hrows)
        pg.commit()
        total += len(chunk)
        sys.stdout.write(f"\r  synced {total:,}/{len(rows):,}  (+{events} status events)")
        sys.stdout.flush()

    cur.execute("SELECT count(*) FROM projects")
    print(f"\nDone. upserted {total:,} projects, logged {events:,} status events.")
    print(f"Supabase projects total now: {cur.fetchone()[0]:,}")


if __name__ == "__main__":
    main()
