#!/usr/bin/env python3
"""
Seed a local SQLite worklist (data/tabs.db) from Supabase.

Why: the daily monitor runs on an ephemeral GitHub Actions runner that has NO
local tabs.db (the 131MB file is gitignored and never committed). The scraper's
--refresh mode needs to know which projects already exist (and their current
status) so it can re-fetch the open ones and skip already-known sequence numbers.
This pulls that worklist from Supabase — the canonical store — making the cron
self-bootstrapping and stateless. Locally (where a full tabs.db already exists)
this is a near no-op: INSERT OR IGNORE never clobbers existing rows.

Seeds ONLY the bookkeeping needed to drive a refresh pass:
  - projects: project_number, current_status, raw_hash, last_seen_at=<far past>
  - attempts: project_number => 'valid'   (so the new-filing scan skips knowns)

The <far past> last_seen_at is deliberate: rows the scraper does NOT re-fetch
this run stay "old", so `sync_to_supabase.py --since <run start>` won't push the
seeded NULLs back over good Supabase data. Only genuinely re-fetched/new rows
(last_seen_at bumped to now) get synced.

Usage:
    set -a; source .env; set +a
    python3 scripts/seed_sqlite_from_supabase.py
"""
import os
import sqlite3
import sys

import psycopg2

# Reuse the scraper's full table definitions so the SQLite schema matches exactly
# (the scraper later upserts every DATA_COL into these tables).
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from scraper.tabs_scraper import SCHEMA  # noqa: E402

SQLITE = "data/tabs.db"
SEED_LAST_SEEN = "2000-01-01T00:00:00+00:00"  # far past => excluded from --since sync


def main():
    url = os.environ.get("DATABASE_URL")
    if not url:
        sys.exit("DATABASE_URL not set (run: set -a; source .env; set +a)")

    os.makedirs(os.path.dirname(SQLITE) or ".", exist_ok=True)
    s = sqlite3.connect(SQLITE, timeout=30)
    s.executescript(SCHEMA)
    s.commit()

    pg = psycopg2.connect(url)
    cur = pg.cursor()
    cur.execute("SELECT project_number, current_status, raw_hash FROM projects")
    rows = cur.fetchall()
    print(f"Supabase projects: {len(rows):,}")

    s.executemany(
        "INSERT OR IGNORE INTO projects"
        "(project_number, current_status, raw_hash, first_seen_at, last_seen_at, last_changed_at)"
        " VALUES (?,?,?,?,?,?)",
        [(pn, st, rh, SEED_LAST_SEEN, SEED_LAST_SEEN, SEED_LAST_SEEN) for pn, st, rh in rows],
    )
    s.executemany(
        "INSERT OR IGNORE INTO attempts(project_number, status, fetched_at) VALUES (?,?,?)",
        [(pn, "valid", SEED_LAST_SEEN) for pn, _, _ in rows],
    )
    s.commit()
    seeded = s.execute("SELECT COUNT(*) FROM projects").fetchone()[0]
    print(f"Local SQLite projects after seed: {seeded:,}")


if __name__ == "__main__":
    main()
