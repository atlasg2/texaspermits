#!/usr/bin/env python3
"""
One-off backfill: extract companies + project_companies from the projects table.

Walks every project in Supabase and pulls the owner / tenant / architect (design firm)
into a deduped `companies` table, then links each project to its companies via
`project_companies` with the role on the relationship (not the company). A company is
identified by its NORMALIZED name, so the same org can be an owner on one project and a
tenant on another (one company, many roles).

Normalization (intentionally simple, per docs/V1_BUILD.md §4): lowercase, collapse every
run of non-alphanumeric characters to a single space, trim. This merges spelling/case/
punctuation variants ("James E. Stroh" == "James E Stroh" == "JAMES E. STROH") without
auto-merging genuinely different legal entities (shell LLCs keep their distinct names).

Idempotent: re-running upserts the same rows (ON CONFLICT DO NOTHING on both tables).

Usage:
    set -a; source .env; set +a
    python3 scripts/build_companies.py
    python3 scripts/build_companies.py --dry-run   # report only, write nothing
"""
import argparse
import os
import re
import sys
from collections import Counter, defaultdict

import psycopg2
from psycopg2.extras import execute_values

# role -> (name column, phone column, address column-or-None)
ROLE_FIELDS = {
    "owner":     ("owner_name",       "owner_phone",       "owner_address"),
    "tenant":    ("tenant_name",      "tenant_phone",      None),
    "architect": ("design_firm_name", "design_firm_phone", "design_firm_address"),
}

_NONALNUM = re.compile(r"[^a-z0-9]+")


def norm(name):
    """Normalize for matching/dedupe. Returns None for blanks."""
    if not name:
        return None
    s = _NONALNUM.sub(" ", name.strip().lower()).strip()
    return s or None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="report only; write nothing")
    args = ap.parse_args()

    url = os.environ.get("DATABASE_URL")
    if not url:
        sys.exit("DATABASE_URL not set (run: set -a; source .env; set +a)")

    pg = psycopg2.connect(url)
    pg.autocommit = False
    cur = pg.cursor()

    cols = ["project_number"]
    for nm, ph, ad in ROLE_FIELDS.values():
        cols += [c for c in (nm, ph, ad) if c]
    cur.execute(f"SELECT {','.join(cols)} FROM projects")
    rows = cur.fetchall()
    idx = {c: i for i, c in enumerate(cols)}
    print(f"scanning {len(rows):,} projects for owner/tenant/architect ...")

    # aggregate per normalized name
    variants = defaultdict(Counter)   # norm -> Counter(original spelling)
    phones   = defaultdict(Counter)   # norm -> Counter(phone)
    addrs    = defaultdict(Counter)   # norm -> Counter(address)
    roles    = defaultdict(Counter)   # norm -> Counter(role)  (for "primary" kind label)
    links    = []                     # (project_number, norm, role)

    for r in rows:
        pn = r[idx["project_number"]]
        for role, (nm_c, ph_c, ad_c) in ROLE_FIELDS.items():
            raw = r[idx[nm_c]]
            n = norm(raw)
            if not n:
                continue
            variants[n][raw.strip()] += 1
            roles[n][role] += 1
            if ph_c and r[idx[ph_c]]:
                phones[n][r[idx[ph_c]].strip()] += 1
            if ad_c and r[idx[ad_c]]:
                addrs[n][r[idx[ad_c]].strip()] += 1
            links.append((pn, n, role))

    print(f"  distinct companies: {len(variants):,}   project-company links: {len(links):,}")

    # build company rows: canonical = most common original spelling; kind = most common role
    companies = []  # (norm_name, canonical_name, name_variants[], kind, phone, address)
    for n, vc in variants.items():
        canonical = vc.most_common(1)[0][0]
        kind = roles[n].most_common(1)[0][0]
        phone = phones[n].most_common(1)[0][0] if phones[n] else None
        addr = addrs[n].most_common(1)[0][0] if addrs[n] else None
        companies.append((n, canonical, sorted(vc.keys()), kind, phone, addr))

    # ---- dedupe sanity report ----
    by_links = Counter(n for _, n, _ in links)
    name_of = {n: vc.most_common(1)[0][0] for n, vc in variants.items()}
    print("\nTop 12 companies by project count (links):")
    for n, k in by_links.most_common(12):
        print(f"  {name_of[n][:50]:50}  links={k:5}  variants={len(variants[n])}")
    print("\nNormalization merges (companies with the most spelling variants):")
    for n, _, nv_list, *_ in sorted(companies, key=lambda c: -len(c[2]))[:8]:
        print(f"  {name_of[n][:40]:40}  merged {len(nv_list)} spellings: {nv_list[:4]}")
    for probe in ("james e stroh", "dean brent barron"):
        if probe in variants:
            print(f"  PROBE {probe!r}: {len(variants[probe])} variant(s), "
                  f"{by_links[probe]} links -> {name_of[probe]!r}")

    if args.dry_run:
        print("\n--dry-run: nothing written.")
        return

    # ---- write companies ----
    print(f"\nupserting {len(companies):,} companies ...")
    execute_values(
        cur,
        "INSERT INTO companies (norm_name, canonical_name, name_variants, kind, phone, address) "
        "VALUES %s ON CONFLICT (norm_name) DO NOTHING",
        companies, page_size=1000,
    )
    pg.commit()

    cur.execute("SELECT norm_name, id FROM companies")
    cid = dict(cur.fetchall())

    # ---- write project_companies ----
    link_rows = [(pn, cid[n], role) for pn, n, role in links if n in cid]
    print(f"linking {len(link_rows):,} project-company relationships ...")
    for i in range(0, len(link_rows), 5000):
        execute_values(
            cur,
            "INSERT INTO project_companies (project_number, company_id, role) VALUES %s "
            "ON CONFLICT (project_number, company_id, role) DO NOTHING",
            link_rows[i:i + 5000], page_size=2000,
        )
        pg.commit()

    cur.execute("SELECT count(*) FROM companies")
    nc = cur.fetchone()[0]
    cur.execute("SELECT count(*) FROM project_companies")
    nl = cur.fetchone()[0]
    print(f"\nDone. companies={nc:,}  project_companies={nl:,}")


if __name__ == "__main__":
    main()
