#!/usr/bin/env python3
"""
Daily engine — the EFFICIENT TABS monitor (V1_BUILD.md §5).

Instead of re-fetching tens of thousands of detail pages, this:
  1. Index-scans the active fiscal years via the TABS SearchProjects JSON API
     (100 projects/request, ~450 requests for FY2025+FY2026 ≈ 1-2 min). The
     index already carries each project's current STATUS code.
  2. Diffs the index status code against the code we stored last run
     (projects.index_status_code). New project numbers + code changes are the
     only ones that need a detail fetch.
  3. Fetches the full detail page ONLY for those (a handful/day) to get the
     authoritative status + owner/architect contacts, upserts into Supabase, and
     appends a status_history row when the status actually moved. THAT is the lead.
  4. Stores the latest index code for every scanned project so tomorrow's diff is
     a clean code-vs-code compare.

Result: the daily run finishes in minutes and is safe on the GitHub Actions cron,
versus the brute-force re-fetch that timed out at 3h.

Note (documented limit, per the plan): scope/sqft edits aren't in the index, so
they're not caught here — a periodic full sweep handles those.

Usage:
    set -a; source .env; set +a
    python3 scripts/daily_update.py                 # current FY + prior FY
    python3 scripts/daily_update.py --years 2026     # one year
    python3 scripts/daily_update.py --dry-run        # report deltas, write nothing
"""
import argparse
import os
import sys
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

import psycopg2
from psycopg2.extras import execute_values
import requests

# Reuse the existing, tested pieces.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # repo root
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))                   # scripts/
from scraper.tabs_scraper import fetch_one                       # noqa: E402
from tabs_index import fetch_page, PAGE, STATUS                  # noqa: E402
from sync_to_supabase import transform, COLNAMES, UPDATE_COLS    # noqa: E402

# Index status codes we can confidently equate to a detail-page status string —
# used only on the FIRST run (when no code is stored yet) to catch the backlog of
# status moves. After that, comparison is pure code-vs-stored-code.
INDEX_CODE_TO_DETAIL = {
    3007: "Project Closed",
    3008: "Project Registered",
    3009: "Review Complete",
    3001: "Inspection Complete",
}


def current_fy() -> int:
    now = datetime.now(timezone.utc)
    return now.year + 1 if now.month >= 9 else now.year


def scan_year(session, year: int, workers: int) -> dict:
    """All index rows for a fiscal year, keyed by project_number. Pages fetched
    in parallel so a full year is seconds, not minutes."""
    rows: dict[str, dict] = {}
    first = fetch_page(session, year, 0)
    if not first:
        print(f"  FY{year}: SearchProjects unreachable — skipping", file=sys.stderr)
        return rows
    total = first["recordsTotal"]
    for r in first["data"]:
        rows[r["ProjectNumber"]] = r
    pages = list(range(PAGE, total, PAGE))
    print(f"  FY{year}: {total:,} projects, {len(pages) + 1} index pages", flush=True)
    with ThreadPoolExecutor(max_workers=workers) as ex:
        for page in ex.map(lambda s: fetch_page(session, year, s), pages):
            if not page:
                print(f"  FY{year}: a page failed — rerun to fill", file=sys.stderr)
                continue
            for r in page["data"]:
                rows[r["ProjectNumber"]] = r
    return rows


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--years", default=None,
                    help="e.g. 2026 or 2025-2026 (default: current FY + prior FY)")
    ap.add_argument("--dry-run", action="store_true",
                    help="report new/changed counts; write nothing")
    ap.add_argument("--workers", type=int, default=8, help="parallel index-page fetches")
    args = ap.parse_args()

    url = os.environ.get("DATABASE_URL")
    if not url:
        sys.exit("DATABASE_URL not set (run: set -a; source .env; set +a)")

    if args.years:
        years = []
        for part in args.years.split(","):
            if "-" in part:
                a, b = part.split("-")
                years += list(range(int(a), int(b) + 1))
            elif part.strip():
                years.append(int(part))
        years = sorted(set(years), reverse=True)
    else:
        fy = current_fy()
        years = [fy, fy - 1]

    print(f"=== daily_update {datetime.now(timezone.utc).isoformat(timespec='seconds')} "
          f"| years={years} | dry_run={args.dry_run} ===")

    # 1. Index-scan (cheap).
    session = requests.Session()
    adapter = requests.adapters.HTTPAdapter(
        pool_connections=args.workers, pool_maxsize=args.workers)
    session.mount("https://", adapter)
    index: dict[str, dict] = {}
    for y in years:
        index.update(scan_year(session, y, args.workers))
    print(f"indexed {len(index):,} projects across {years}", flush=True)
    if not index:
        sys.exit("index empty — aborting (network?)")

    # 2. Load current Supabase state for those years.
    pg = psycopg2.connect(url)
    pg.autocommit = False
    cur = pg.cursor()
    likes = " OR ".join(["project_number LIKE %s"] * len(years))
    cur.execute(
        f"SELECT project_number, index_status_code, current_status FROM projects "
        f"WHERE {likes}",
        tuple(f"TABS{y}%" for y in years),
    )
    supa = {pn: (code, status) for pn, code, status in cur.fetchall()}
    print(f"supabase has {len(supa):,} of them")

    # 3. Decide what needs a detail fetch: new PNs + status-code changes.
    new_pns, changed_pns = [], []
    for pn, row in index.items():
        code = row.get("ProjectStatus")
        if pn not in supa:
            new_pns.append(pn)
            continue
        stored_code, cur_status = supa[pn]
        if stored_code is not None:
            if code != stored_code:
                changed_pns.append(pn)
        else:  # first run for this project: fall back to mapped-status compare
            mapped = INDEX_CODE_TO_DETAIL.get(code)
            if mapped is not None and mapped != (cur_status or ""):
                changed_pns.append(pn)

    todo = new_pns + changed_pns
    print(f"NEW filings: {len(new_pns):,} | status changes: {len(changed_pns):,} | "
          f"detail fetches needed: {len(todo):,}")

    if args.dry_run:
        for pn in changed_pns[:15]:
            old = supa[pn][1]
            print(f"  ~ {pn}: status code {supa[pn][0]} -> {index[pn].get('ProjectStatus')} "
                  f"({STATUS.get(index[pn].get('ProjectStatus'),'?')}), was {old!r}")
        for pn in new_pns[:10]:
            print(f"  + {pn}: NEW ({STATUS.get(index[pn].get('ProjectStatus'),'?')})")
        print("dry-run: no writes.")
        return

    # 4. Fetch details only for new/changed, upsert, log status events.
    upsert_sql = (
        f"INSERT INTO projects ({','.join(COLNAMES)}) VALUES %s "
        f"ON CONFLICT (project_number) DO UPDATE SET "
        + ", ".join(f"{c}=EXCLUDED.{c}" for c in UPDATE_COLS)
        + ", last_seen_at=now(), "
        f"last_changed_at = CASE WHEN projects.raw_hash IS DISTINCT FROM EXCLUDED.raw_hash "
        f"THEN now() ELSE projects.last_changed_at END"
    )

    fetched_rows, history, errored = [], [], []
    for i, pn in enumerate(todo, 1):
        status, rec = fetch_one(session, pn)
        if status != "valid" or not rec:
            errored.append(pn)
            continue
        fetched_rows.append(transform(rec))
        old = supa.get(pn, (None, None))[1]
        new = (rec.get("current_status") or "").strip() or None
        if (old or None) != new:
            history.append((pn, old, new))
        if i % 50 == 0:
            sys.stdout.write(f"\r  fetched {i:,}/{len(todo):,}")
            sys.stdout.flush()
    print()

    if fetched_rows:
        execute_values(cur, upsert_sql, fetched_rows)
    if history:
        execute_values(
            cur,
            "INSERT INTO status_history(project_number, old_status, new_status) VALUES %s",
            history,
        )
    pg.commit()

    # 5. Store the latest index code for every scanned project (except ones whose
    #    detail fetch errored — leave those to retry), so tomorrow is code-vs-code.
    errset = set(errored)
    code_rows = [(pn, row.get("ProjectStatus"))
                 for pn, row in index.items() if pn not in errset]
    for j in range(0, len(code_rows), 1000):
        execute_values(
            cur,
            "UPDATE projects AS p SET index_status_code = v.code "
            "FROM (VALUES %s) AS v(pn, code) WHERE p.project_number = v.pn",
            code_rows[j:j + 1000],
        )
    pg.commit()

    print(f"Done. upserted {len(fetched_rows):,} projects, "
          f"logged {len(history):,} status events, "
          f"{len(errored)} detail fetch error(s), "
          f"stored {len(code_rows):,} index codes.")


if __name__ == "__main__":
    main()
