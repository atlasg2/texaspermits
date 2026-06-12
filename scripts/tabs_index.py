#!/usr/bin/env python3
"""
TABS project index fetcher.

Uses the TABS search endpoint (/TABS/Search/SearchProjects — the same JSON API
the public search page calls) to enumerate every VALID project number for the
requested fiscal years, 100 rows per request. Stores results in the local
SQLite `project_index` table.

Why this exists:
  * The detail backfill no longer has to probe empty sequence numbers
    (~18% of FY2026 seqs were empty) or binary-search the year's max seq.
  * recordsTotal gives the exact project count per year up front.
  * Later, the lead engine can poll status changes for a whole year in
    ~N/100 requests instead of N detail-page fetches.

Usage:
    python3 scripts/tabs_index.py --years 2025
    python3 scripts/tabs_index.py --years 2021-2026 --workers 6
"""
import argparse
import os
import sqlite3
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

import requests

SEARCH_URL = "https://www.tdlr.texas.gov/TABS/Search/SearchProjects"
HEADERS = {"User-Agent": "Mozilla/5.0 (TABS research scraper; polite)"}
DEFAULT_DB = "data/tabs.db"
PAGE = 100          # server caps page length at 100
TIMEOUT = 30
RETRIES = 3
DATA_VERSION_TABS = 900001

STATUS = {
    3001: "Inspection Completed", 3002: "Inspection Process",
    3003: "Inspection Scheduled", 3004: "Preliminary Plan Review",
    3005: "Miscellaneous", 3006: "Preliminary Review Pending",
    3007: "Project Closed", 3008: "Project Registered",
    3009: "Review Complete", 3010: "Review Pending",
}

SCHEMA = """
CREATE TABLE IF NOT EXISTS project_index(
  project_number TEXT PRIMARY KEY,
  project_id TEXT,
  project_name TEXT,
  facility_name TEXT,
  created_on TEXT,
  status_code INTEGER,
  status TEXT,
  city_code INTEGER,
  county_code INTEGER,
  work_type_code INTEGER,
  estimated_cost REAL,
  est_start_date TEXT,
  est_end_date TEXT,
  fetched_at TEXT
);
"""


def iso():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def fetch_page(session, year, start):
    """Return parsed JSON for one 100-row page, or None after retries."""
    payload = {
        "draw": 1, "start": start, "length": PAGE,
        "ProjectNumber": f"TABS{year}", "DataVersionId": DATA_VERSION_TABS,
    }
    for attempt in range(RETRIES):
        try:
            r = session.post(SEARCH_URL, data=payload, headers=HEADERS, timeout=TIMEOUT)
            if r.status_code == 200:
                return r.json()
        except (requests.RequestException, ValueError):
            pass
        time.sleep(1.5 * (attempt + 1))
    return None


def upsert_rows(conn, rows):
    now = iso()
    for r in rows:
        code = r.get("ProjectStatus")
        conn.execute(
            """INSERT OR REPLACE INTO project_index
               (project_number, project_id, project_name, facility_name, created_on,
                status_code, status, city_code, county_code, work_type_code,
                estimated_cost, est_start_date, est_end_date, fetched_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (r.get("ProjectNumber"), r.get("ProjectId"), r.get("ProjectName"),
             r.get("FacilityName"), r.get("ProjectCreatedOn"),
             code, STATUS.get(code, "Unknown"),
             r.get("City"), r.get("County"), r.get("TypeOfWork"),
             r.get("EstimatedCost"), r.get("EstimatedStartDate"),
             r.get("EstimatedEndDate"), now),
        )
    conn.commit()


def parse_years(spec):
    out = []
    for part in spec.split(","):
        part = part.strip()
        if "-" in part:
            a, b = part.split("-")
            out.extend(range(int(a), int(b) + 1))
        elif part:
            out.append(int(part))
    return sorted(set(out), reverse=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--years", required=True, help="e.g. 2025  or  2021-2026")
    ap.add_argument("--workers", type=int, default=6)
    ap.add_argument("--db", default=DEFAULT_DB)
    args = ap.parse_args()

    os.makedirs(os.path.dirname(args.db) or ".", exist_ok=True)
    conn = sqlite3.connect(args.db)
    conn.execute("PRAGMA busy_timeout=30000")
    conn.executescript(SCHEMA)
    conn.commit()

    session = requests.Session()
    for year in parse_years(args.years):
        first = fetch_page(session, year, 0)
        if first is None:
            print(f"FY{year}: search endpoint unreachable, skipping", file=sys.stderr)
            continue
        total = first["recordsTotal"]
        upsert_rows(conn, first["data"])
        starts = list(range(PAGE, total, PAGE))
        print(f"FY{year}: {total:,} projects, {len(starts) + 1} pages")

        fetched = len(first["data"])
        with ThreadPoolExecutor(max_workers=args.workers) as ex:
            for page in ex.map(lambda s: fetch_page(session, year, s), starts):
                if page is None:
                    print(f"\nFY{year}: a page failed after retries — rerun to fill gaps",
                          file=sys.stderr)
                    continue
                upsert_rows(conn, page["data"])
                fetched += len(page["data"])
                sys.stdout.write(f"\r  indexed {fetched:,}/{total:,}")
                sys.stdout.flush()
        (count,) = conn.execute(
            "SELECT COUNT(*) FROM project_index WHERE project_number LIKE ?",
            (f"TABS{year}%",),
        ).fetchone()
        print(f"\n  FY{year} index rows in DB: {count:,}")

    print("Index complete.")


if __name__ == "__main__":
    main()
