#!/usr/bin/env python3
"""
TABS proof-of-concept scraper.

Goal: harvest ~200 real Architectural Barriers projects across several years
(so we see a VARIETY of statuses, not just closed ones), parse every visible
field section-by-section, and dump to CSV so we can eyeball the real data
before committing a Postgres schema.

Source: https://www.tdlr.texas.gov/TABS/Search/Print/TABS{YEAR}{SEQ:06d}
Project numbers are enumerable; an invalid number renders an empty template,
so we detect "valid" by the presence of a real Project Name value.
"""
import csv
import hashlib
import re
import sys
import time
import requests
from bs4 import BeautifulSoup

BASE = "https://www.tdlr.texas.gov/TABS/Search/Print/{pn}"
HEADERS = {"User-Agent": "Mozilla/5.0 (research; polite TABS sampler)"}
DELAY = 0.7              # seconds between requests (be a good citizen)
PER_YEAR = 50           # keep up to this many valid projects per year
SCAN_LIMIT = 400        # max sequences to scan per year before giving up
YEARS = [2021, 2023, 2025, 2026]

# Bind fields by the section's own <div class="project-details-*"> container
# (not "next <dl>"), so empty sections can't bleed into the next one.
SECTION_DIV = {
    "project-details-project": "",
    "project-details-contact": "filer",
    "project-details-ras": "ras",
    "project-details-owner": "owner",
    "project-details-tenant": "tenant",
    "project-details-designer": "design_firm",
}


def clean(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "").strip())


def slug(label: str) -> str:
    label = label.strip().rstrip(":")
    label = re.sub(r"[^a-z0-9]+", "_", label.lower()).strip("_")
    return label


def parse(pn: str, html: str) -> dict | None:
    soup = BeautifulSoup(html, "html.parser")
    row: dict[str, str] = {"project_number": pn}

    # Header block: Project # and Registration Date live outside the dl sections
    text = clean(soup.get_text(" "))
    m = re.search(r"Registration Date:\s*([\d/]+)", text)
    if m:
        row["registration_date"] = m.group(1)

    found_name = False
    for div_class, prefix in SECTION_DIV.items():
        div = soup.find("div", class_=div_class)
        if div is None:
            continue
        # Parse every dt -> following dd(s) across ALL dls in this section
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
            value = ", ".join(vals)
            key = f"{prefix}_{label}" if prefix else label
            if value or key not in row:
                row[key] = value
            if key == "project_name" and value:
                found_name = True

    return row if found_name else None


def fetch(pn: str, session: requests.Session) -> tuple[str | None, str]:
    url = BASE.format(pn=pn)
    for attempt in range(3):
        try:
            r = session.get(url, headers=HEADERS, timeout=25)
            if r.status_code == 200:
                return r.text, ""
            return None, f"http {r.status_code}"
        except requests.RequestException as e:
            time.sleep(1.5 * (attempt + 1))
            last = str(e)
    return None, last


def main():
    session = requests.Session()
    rows: list[dict] = []
    all_keys: list[str] = ["project_number"]

    for year in YEARS:
        kept = 0
        misses = 0
        for seq in range(1, SCAN_LIMIT + 1):
            if kept >= PER_YEAR:
                break
            pn = f"TABS{year}{seq:06d}"
            html, err = fetch(pn, session)
            time.sleep(DELAY)
            if html is None:
                misses += 1
                continue
            rec = parse(pn, html)
            if rec is None:
                misses += 1
                # 40 consecutive empties => past the end of this year's range
                if misses > 40:
                    break
                continue
            misses = 0
            rec["_content_hash"] = hashlib.sha256(html.encode("utf-8", "ignore")).hexdigest()[:16]
            rows.append(rec)
            for k in rec:
                if k not in all_keys:
                    all_keys.append(k)
            kept += 1
            sys.stdout.write(f"\r{year}: kept {kept:2d}  (seq {seq})   ")
            sys.stdout.flush()
        print(f"\n{year}: collected {kept} projects")

    out = "/workspaces/elite/tabs_poc.csv"
    with open(out, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=all_keys, extrasaction="ignore")
        w.writeheader()
        for r in rows:
            w.writerow(r)

    print(f"\nWrote {len(rows)} rows x {len(all_keys)} columns -> {out}")
    # quick field fill-rate + status distribution summary
    print("\n--- field fill rates ---")
    for k in all_keys:
        n = sum(1 for r in rows if clean(r.get(k, "")))
        print(f"  {n/len(rows)*100:5.1f}%  {k}")
    print("\n--- current_status distribution ---")
    from collections import Counter
    c = Counter(clean(r.get("current_status", "(none)")) for r in rows)
    for s, n in c.most_common():
        print(f"  {n:3d}  {s}")
    print("\n--- type_of_work distribution ---")
    c = Counter(clean(r.get("type_of_work", "(none)")) for r in rows)
    for s, n in c.most_common():
        print(f"  {n:3d}  {s}")


if __name__ == "__main__":
    main()
