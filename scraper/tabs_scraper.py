#!/usr/bin/env python3
"""
TABS resumable backfill scraper.

Enumerates Architectural Barriers project numbers (TABS{FY}{SEQ:06d}), fetches
the print view, parses every field, and stores results in SQLite.

RESUMABLE BY DESIGN
-------------------
Every fetched number is committed to the `attempts` table immediately. If the
process stops for ANY reason (Wi-Fi drop, Ctrl-C, crash, laptop sleep), just run
the same command again: it loads the set of already-attempted numbers and skips
them, continuing exactly where it left off. Nothing is lost.

NO AI / NO MODEL is used at runtime. This is plain Python (requests + bs4).

Usage:
    pip install requests beautifulsoup4
    python3 scraper/tabs_scraper.py --years 2021-2025 --workers 4
    python3 scraper/tabs_scraper.py --years 2026 --workers 4      # add/resume a year
    python3 scraper/tabs_scraper.py --years 2026 --max-seq 40      # tiny smoke test
"""
import argparse
import os
import re
import sqlite3
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

import requests
from bs4 import BeautifulSoup

PRINT_URL = "https://www.tdlr.texas.gov/TABS/Search/Print/{pn}"
HEADERS = {"User-Agent": "Mozilla/5.0 (TABS research scraper; polite)"}
DEFAULT_DB = "data/tabs.db"
DEFAULT_MAX_SEQ = 30000            # safely above observed per-year max (~27.5k)
TIMEOUT = 25
RETRIES = 3

# Bind each field to its own section <div> so empty sections can't bleed.
SECTION_DIV = {
    "project-details-project": "",
    "project-details-contact": "filer",
    "project-details-ras": "ras",
    "project-details-owner": "owner",
    "project-details-tenant": "tenant",
    "project-details-designer": "design_firm",
}

# Output columns that hold scraped data (bookkeeping cols handled separately).
DATA_COLS = [
    "registration_date", "project_name", "facility_name",
    "location_full", "location_city", "location_state", "location_zip", "location_county",
    "start_date", "completion_date",
    "estimated_cost_raw", "estimated_cost_num",
    "type_of_work", "type_of_funds", "scope_of_work",
    "square_footage_raw", "square_footage_num",
    "tenant_private_funds", "current_status",
    "filer_contact_name",
    "ras_name", "ras_number", "ras_address", "ras_phone",
    "owner_name", "owner_address", "owner_phone", "owner_contact_name",
    "tenant_name", "tenant_phone",
    "design_firm_name", "design_firm_address", "design_firm_phone",
    "raw_hash",
]

SCHEMA = """
CREATE TABLE IF NOT EXISTS attempts(
  project_number TEXT PRIMARY KEY,
  status TEXT,                 -- 'valid' | 'empty'
  fetched_at TEXT
);
CREATE TABLE IF NOT EXISTS projects(
  project_number TEXT PRIMARY KEY,
  registration_date TEXT, project_name TEXT, facility_name TEXT,
  location_full TEXT, location_city TEXT, location_state TEXT, location_zip TEXT, location_county TEXT,
  start_date TEXT, completion_date TEXT,
  estimated_cost_raw TEXT, estimated_cost_num INTEGER,
  type_of_work TEXT, type_of_funds TEXT, scope_of_work TEXT,
  square_footage_raw TEXT, square_footage_num INTEGER,
  tenant_private_funds TEXT, current_status TEXT,
  filer_contact_name TEXT,
  ras_name TEXT, ras_number TEXT, ras_address TEXT, ras_phone TEXT,
  owner_name TEXT, owner_address TEXT, owner_phone TEXT, owner_contact_name TEXT,
  tenant_name TEXT, tenant_phone TEXT,
  design_firm_name TEXT, design_firm_address TEXT, design_firm_phone TEXT,
  raw_hash TEXT, first_seen_at TEXT, last_seen_at TEXT, last_changed_at TEXT
);
CREATE TABLE IF NOT EXISTS status_history(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_number TEXT, old_status TEXT, new_status TEXT, changed_at TEXT
);
CREATE INDEX IF NOT EXISTS ix_projects_status ON projects(current_status);
CREATE INDEX IF NOT EXISTS ix_projects_county ON projects(location_county);
"""


def load_index_pns(conn, year):
    """Valid project numbers for a year from project_index (see scripts/tabs_index.py),
    newest first. Empty list if the index hasn't been built for that year."""
    try:
        rows = conn.execute(
            "SELECT project_number FROM project_index WHERE project_number LIKE ? "
            "ORDER BY project_number DESC",
            (f"TABS{year}%",),
        ).fetchall()
    except sqlite3.OperationalError:
        return []
    return [pn for (pn,) in rows]


# ----------------------------- parsing ----------------------------- #
def clean(s):
    return re.sub(r"\s+", " ", (s or "").strip())


def slug(label):
    label = label.strip().rstrip(":")
    return re.sub(r"[^a-z0-9]+", "_", label.lower()).strip("_")


def to_int(s):
    digits = re.sub(r"[^\d]", "", s or "")
    return int(digits) if digits else None


def split_location(full):
    """'8519 Williams Drive, Georgetown, TX 78633' -> (street_full, city, state, zip)."""
    city = state = zipc = None
    m = re.search(r",\s*([^,]+),\s*([A-Z]{2})\s*(\d{5})(?:-\d{4})?\s*$", full or "")
    if m:
        city, state, zipc = m.group(1).strip(), m.group(2), m.group(3)
    return full, city, state, zipc


def parse(pn, html_text):
    """Return normalized record dict, or None if the number has no real project."""
    import hashlib
    soup = BeautifulSoup(html_text, "html.parser")
    raw = {}

    m = re.search(r"Registration Date:\s*([\d/]+)", clean(soup.get_text(" ")))
    if m:
        raw["registration_date"] = m.group(1)

    found_name = False
    for div_class, prefix in SECTION_DIV.items():
        div = soup.find("div", class_=div_class)
        if div is None:
            continue
        for dt in div.find_all("dt"):
            label = slug(dt.get_text())
            if not label:
                continue
            vals = []
            for sib in dt.find_next_siblings():
                if sib.name == "dt":
                    break
                if sib.name == "dd":
                    v = clean(sib.get_text())
                    if v:
                        vals.append(v)
            key = f"{prefix}_{label}" if prefix else label
            value = ", ".join(vals)
            if value or key not in raw:
                raw[key] = value
            if key == "project_name" and value:
                found_name = True

    if not found_name:
        return None

    loc_full, city, state, zipc = split_location(raw.get("location_address", ""))
    rec = {
        "project_number": pn,
        "registration_date": raw.get("registration_date", ""),
        "project_name": raw.get("project_name", ""),
        "facility_name": raw.get("facility_name", ""),
        "location_full": loc_full,
        "location_city": city, "location_state": state, "location_zip": zipc,
        "location_county": raw.get("location_county", ""),
        "start_date": raw.get("start_date", ""),
        "completion_date": raw.get("completion_date", ""),
        "estimated_cost_raw": raw.get("estimated_cost", ""),
        "estimated_cost_num": to_int(raw.get("estimated_cost", "")),
        "type_of_work": raw.get("type_of_work", ""),
        "type_of_funds": raw.get("type_of_funds", ""),
        "scope_of_work": raw.get("scope_of_work", ""),
        "square_footage_raw": raw.get("square_footage", ""),
        "square_footage_num": to_int(raw.get("square_footage", "")),
        "tenant_private_funds": raw.get("are_the_private_funds_provided_by_the_tenant", ""),
        "current_status": raw.get("current_status", ""),
        "filer_contact_name": raw.get("filer_contact_name", ""),
        "ras_name": raw.get("ras_ras_name", ""),
        "ras_number": raw.get("ras_ras", ""),
        "ras_address": raw.get("ras_ras_address", ""),
        "ras_phone": raw.get("ras_ras_phone", ""),
        "owner_name": raw.get("owner_owner_name", ""),
        "owner_address": raw.get("owner_owner_address", ""),
        "owner_phone": raw.get("owner_owner_phone", ""),
        "owner_contact_name": raw.get("owner_contact_name", ""),
        "tenant_name": raw.get("tenant_tenant_name", ""),
        "tenant_phone": raw.get("tenant_tenant_phone", ""),
        "design_firm_name": raw.get("design_firm_design_firm_name", ""),
        "design_firm_address": raw.get("design_firm_design_firm_address", ""),
        "design_firm_phone": raw.get("design_firm_design_firm_phone", ""),
        "raw_hash": hashlib.sha256(html_text.encode("utf-8", "ignore")).hexdigest()[:16],
    }
    return rec


# ----------------------------- fetching ----------------------------- #
def fetch_one(session, pn):
    """Return ('valid', rec) | ('empty', None) | ('error', None)."""
    url = PRINT_URL.format(pn=pn)
    for attempt in range(RETRIES):
        try:
            r = session.get(url, headers=HEADERS, timeout=TIMEOUT)
            if r.status_code != 200:
                time.sleep(1.0 * (attempt + 1))
                continue
            rec = parse(pn, r.text)
            return ("valid", rec) if rec else ("empty", None)
        except requests.RequestException:
            time.sleep(1.5 * (attempt + 1))
    return ("error", None)


def detect_max_seq(session, year, cap):
    """Find ~highest used sequence for a fiscal year via window-sampled binary
    search, so 'newest-first' can count down from the real top instead of
    scanning thousands of empty numbers. Adds a margin to catch the very latest."""
    def alive(seq):
        for s in range(max(1, seq - 2), seq + 3):
            st, _ = fetch_one(session, f"TABS{year}{s:06d}")
            if st == "valid":
                return True
        return False

    lo, hi = 1, 1000
    while hi < cap and alive(hi):
        lo, hi = hi, hi * 2
    hi = min(hi, cap)
    while hi - lo > 100:
        mid = (lo + hi) // 2
        if alive(mid):
            lo = mid
        else:
            hi = mid
    return min(hi + 300, cap)


# ----------------------------- storage ----------------------------- #
def iso():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def upsert_project(conn, rec):
    now = iso()
    cur = conn.execute(
        "SELECT current_status FROM projects WHERE project_number=?",
        (rec["project_number"],),
    )
    row = cur.fetchone()
    if row is None:
        cols = ["project_number"] + DATA_COLS + ["first_seen_at", "last_seen_at", "last_changed_at"]
        vals = [rec["project_number"]] + [rec.get(c) for c in DATA_COLS] + [now, now, now]
        conn.execute(
            f"INSERT INTO projects ({','.join(cols)}) VALUES ({','.join('?' * len(cols))})",
            vals,
        )
        conn.execute(
            "INSERT INTO status_history(project_number,old_status,new_status,changed_at) VALUES (?,?,?,?)",
            (rec["project_number"], None, rec.get("current_status"), now),
        )
    else:
        old_status = row[0]
        new_status = rec.get("current_status")
        sets = ", ".join(f"{c}=?" for c in DATA_COLS)
        vals = [rec.get(c) for c in DATA_COLS]
        if old_status != new_status:
            conn.execute(
                f"UPDATE projects SET {sets}, last_seen_at=?, last_changed_at=? WHERE project_number=?",
                vals + [now, now, rec["project_number"]],
            )
            conn.execute(
                "INSERT INTO status_history(project_number,old_status,new_status,changed_at) VALUES (?,?,?,?)",
                (rec["project_number"], old_status, new_status, now),
            )
        else:
            conn.execute(
                f"UPDATE projects SET {sets}, last_seen_at=? WHERE project_number=?",
                vals + [now, rec["project_number"]],
            )


def load_done(conn, years):
    done = set()
    for y in years:
        for (pn,) in conn.execute(
            "SELECT project_number FROM attempts WHERE project_number LIKE ?", (f"TABS{y}%",)
        ):
            done.add(pn)
    return done


# ----------------------------- driver ----------------------------- #
def parse_years(spec):
    out = []
    for part in spec.split(","):
        part = part.strip()
        if "-" in part:
            a, b = part.split("-")
            out.extend(range(int(a), int(b) + 1))
        elif part:
            out.append(int(part))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--years", required=True, help="e.g. 2021-2025  or  2026  or  2023,2025")
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--max-seq", type=int, default=DEFAULT_MAX_SEQ)
    ap.add_argument("--db", default=DEFAULT_DB)
    ap.add_argument(
        "--order", choices=["newest", "oldest"], default="newest",
        help="newest = freshest fiscal year + latest filings first (default)",
    )
    ap.add_argument(
        "--index", action="store_true",
        help="use project_index (built by scripts/tabs_index.py) as the candidate "
             "list — fetches only known-valid numbers, no empty-seq probing",
    )
    args = ap.parse_args()

    os.makedirs(os.path.dirname(args.db) or ".", exist_ok=True)
    conn = sqlite3.connect(args.db)
    conn.executescript(SCHEMA)
    conn.commit()

    session = requests.Session()
    adapter = requests.adapters.HTTPAdapter(
        pool_connections=args.workers, pool_maxsize=args.workers
    )
    session.mount("https://", adapter)
    years = sorted(set(parse_years(args.years)), reverse=(args.order == "newest"))
    done = load_done(conn, years)

    # Build candidate numbers in the requested order. For "newest" we detect each
    # year's real max sequence (a few seconds) and count DOWN from it, so the most
    # recent registrations land first and we don't scan thousands of empties.
    candidates = []
    for y in years:
        if args.index:
            pns = load_index_pns(conn, y)
            if pns:
                print(f"  FY{y}: {len(pns):,} valid numbers from project_index")
                if args.order == "oldest":
                    pns = pns[::-1]
                candidates.extend(pn for pn in pns if pn not in done)
                continue
            print(f"  FY{y}: project_index empty — falling back to sequence scan "
                  f"(run scripts/tabs_index.py)")
        if args.order == "newest":
            top = detect_max_seq(session, y, args.max_seq)
            seqs = range(top, 0, -1)
            print(f"  FY{y}: scanning seq {top} -> 1 (latest filings first)")
        else:
            seqs = range(1, args.max_seq + 1)
        for s in seqs:
            pn = f"TABS{y}{s:06d}"
            if pn not in done:
                candidates.append(pn)

    total = len(candidates)
    print(f"Years {years} | order={args.order} | already done: {len(done):,} | "
          f"to fetch: {total:,} | workers: {args.workers}")
    if total == 0:
        print("Nothing to do — already complete for these years.")
        return

    start = time.time()
    processed = valid = errors = 0
    pending = []  # (pn, status, rec)

    def flush():
        for pn, status, rec in pending:
            if status == "valid":
                upsert_project(conn, rec)
            if status in ("valid", "empty"):
                conn.execute(
                    "INSERT OR REPLACE INTO attempts(project_number,status,fetched_at) VALUES (?,?,?)",
                    (pn, status, iso()),
                )
        conn.commit()
        pending.clear()

    try:
        with ThreadPoolExecutor(max_workers=args.workers) as ex:
            futs = {ex.submit(fetch_one, session, pn): pn for pn in candidates}
            for fut in futs:
                pn = futs[fut]
                status, rec = fut.result()
                processed += 1
                if status == "valid":
                    valid += 1
                elif status == "error":
                    errors += 1
                if status in ("valid", "empty"):
                    pending.append((pn, status, rec))
                if len(pending) >= 200:
                    flush()
                if processed % 500 == 0:
                    rate = processed / max(time.time() - start, 0.1)
                    eta = (total - processed) / max(rate, 0.1)
                    sys.stdout.write(
                        f"\r{processed:,}/{total:,}  valid:{valid:,}  err:{errors}  "
                        f"{rate:.0f}/s  ETA {eta/60:.0f}m   "
                    )
                    sys.stdout.flush()
            flush()
    except KeyboardInterrupt:
        flush()
        print("\nInterrupted — progress saved. Re-run the same command to resume.")
        return

    flush()
    dur = time.time() - start
    print(
        f"\nDone. processed {processed:,} | valid {valid:,} | errors {errors} "
        f"(will retry next run) | {dur/60:.1f} min"
    )
    print(f"DB: {args.db}")


if __name__ == "__main__":
    main()
