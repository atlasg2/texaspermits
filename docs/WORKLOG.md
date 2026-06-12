# WORKLOG

> Chronological progress, newest at top. Updated every prompt so context is
> never lost. Each entry: what was asked, what was done, what's next.

---

## 2026-06-12 — Deleted v0 web UI; CLUB4/gym deal-finding analysis
**Asked:** Delete the old web design entirely (no record, no bias for future design work).
Research Club 4 Fitness (Elite's flooring client). Explore the data for deal-finding angles:
gyms under construction, architects, shell-corp identification, franchise vs corporate.
**Done:**
- Deleted `web/` + `docs/UI.md` (never committed — zero record remains).
- CLUB4 Fitness: family-owned/operated since 2002 (Mike Elinski), 40+ corporate locations
  (not franchise) across the Southeast incl. TX. Corporate model ⇒ one relationship covers
  all new sites.
- **Found live CLUB4 leads in our data**: El Paso (TABS2025022210, $3.5M, Review Complete),
  Bryan (TABS2026003898, $3.5M), Plano (TABS2026018330, $3M, reg. 4/22/2026). All three
  use **Dean Brent Barron Architect** — CLUB4's TX architect of record. Two have shell-LLC
  owners (14SM TT Owner LLC, 30x30 Townshire Partners LLC); the tenant field + repeat
  architect unmask the brand.
- Brand→architect fingerprints confirmed: EOS Fitness→James E. Stroh; Crunch→JPlus/
  Phillips Partnership; Planet Fitness→MJM Architects. Gym projects registered *this week*:
  Crunch McKinney 6/8, Crunch Royse City $4.9M 6/5, EOS Little Elm $6.4M + Plano $5.6M 6/5.
- Key data lessons: tenant_name (not owner) carries gym brands (gyms lease; owners are
  SPE shells); '%club 4%' collides with Sam's Club store numbers — brand matching needs
  curated keyword sets per vertical.
- Backfill meanwhile: index phase done for all 4 years; detail scrape running —
  70,148 pages, 100% valid (zero waste vs 18% empties before), ~4h ETA.
**Next:** lead-lens design (vertical keyword sets + stage + cost filters); daily
GitHub Actions watcher; architect-fingerprint table.

## 2026-06-12 — Found TABS JSON search API; index-driven backfill for FY2023–2026
**Asked:** Check how far the backfill got; find a better/faster way to complete. Scope:
data through the past 3 years only (FY2023–2026, nothing earlier).
**Done:**
- Status check: the Jun 9 run died when the Codespace shut down. FY2026 complete
  (18,642 projects), FY2025 ~25% (6,515 local / 6,139 in Supabase), Supabase total 24,781.
- **Found `/TABS/Search/SearchProjects`** — the JSON endpoint behind the public search page.
  POST with DataTables params + `ProjectNumber=TABS{year}` prefix filter; returns 100
  rows/request (~1s) with ProjectId, status code, cost, dates, city/county codes, and exact
  `recordsTotal` per year (FY2025 = 25,671 valid). No bulk dataset exists on data.texas.gov.
- New `scripts/tabs_index.py`: pages that endpoint into SQLite `project_index` (status code
  map 3001–3010, work-type map 9001–9005). A whole year indexes in ~2 min.
- `tabs_scraper.py --index`: candidates come from `project_index` instead of probing every
  seq 1→max — no more empty fetches (18% of FY2026 was empties) or max-seq binary search.
  Falls back to seq scan if index is empty. Also sized the HTTP pool to worker count.
- `run_backfill.sh` now builds the index first, then scrapes with `--index`.
- Relaunched: `./run_backfill.sh 2023-2026 12` + sync watcher (5 min), both background.
  Index immediately showed FY2026 grew to 18,933 (+291 new filings since Jun 9) — picked up
  automatically. ETA ~3h for FY2025 remainder + FY2024 + FY2023.
- Future win: the index endpoint makes status-change polling ~100× cheaper
  (~260 requests/year vs 25k detail fetches) — this is the recurring-watch mechanism.
**Next:** verify counts when the run finishes; wire index-based status polling into the
recurring lead-detection job; app.

## 2026-06-09 — Resume FY2026 + continue into FY2025
**Asked:** Resume scraping all of 2026; then keep going with the next year too.
**Done:**
- Found the prior FY2026 background backfill had died near the end (log stopped ~21,000/21,947)
  before reaching the Supabase sync step. DB state: 21,750/22,697 seqs attempted for 2026,
  17,940 valid projects — ~947 left.
- Relaunched the self-healing runner for the **2025-2026 range**: `./run_backfill.sh 2025-2026 8`
  (background, detached). With `--order newest` it sorts years descending, so it finishes the
  remaining ~947 of FY2026 first (skips the already-attempted seqs — fully resumable), then
  rolls straight into all of FY2025, then UPSERTs both years into Supabase.
- Verified running: pids for run_backfill.sh + tabs_scraper, logging to data/backfill.log.
- Added **sync_watcher.sh**: incremental SQLite→Supabase sync every 5 min during the
  backfill (idempotent UPSERT) so a mid-run crash never loses what already reached Supabase;
  stops on the backfill's `ALL DONE` marker. Added 30s busy_timeout to the SQLite reader for
  safe concurrent reads.
- **Bug fixed:** a scraped text field held a NUL (0x00) byte → Postgres rejects NUL in string
  literals → sync died ~13.5k rows in. Fixed in `nz()` (strip NUL on all text cols). Watcher
  re-invokes python fresh each pass, so it picks up the fix automatically next cycle.
- FY2026 finished (22,697/22,697); FY2025 underway. Both background-detached — independent of
  the Claude session, fully resumable.
**Next:** confirm a clean sync pass; verify FY2025+FY2026 counts in Supabase; earlier years; app.

## 2026-06-09 — Strategy doc (v0)
**Asked:** Think through the product/business; is anyone doing this already; what's the plan.
**Done:** Researched landscape — no one productizes TABS as leads; comps are Dodge
($6–12k/yr/seat, batch) & ConstructConnect ($4.8–8.4k/yr/seat); they miss ~⅓ of projects.
Wrote `docs/STRATEGY.md` (v0, explicitly evolving): TABS = the early signal the big tools
charge thousands for; moat = status history (can't backfill) + architect→GC linkage; phased
plan (use for Elite → niche paid pilot $99–299/mo → SaaS → expand). Committed.

## 2026-06-09 — Supabase sync + FY2026 backfill launched
**Asked:** Build SQLite→Supabase sync; run FY2026 into Supabase (background, committing as we go).
**Done:**
- `scripts/sync_to_supabase.py`: idempotent UPSERT keyed on project_number, type
  conversions (M/D/YYYY→date, cost/sqft→numeric, Yes/No→bool, ''→NULL), logs
  status changes into status_history. Tested: 622 FY2026 rows + 622 status events
  landed in Supabase with correct types.
- `run_backfill.sh`: self-healing loop (scrape newest-first → resume on crash →
  sync to Supabase at the end). Logs to data/backfill.log.
- Launched FY2026 backfill in background (~85 min, resumable).
**Next:** when FY2026 completes, verify in Supabase; then run remaining years; start app.

## 2026-06-09 — Conventions doc (CLAUDE.md) + cleanup
**Asked:** Delete old `spec1.md` (abandoned permit-engine direction); add a "how we
work like a pro" doc to follow as we go (worklog, commits/pushes, SQL migrations).
**Done:**
- Deleted `spec1.md` (old city-permit-engine spec; superseded by the TABS approach).
- Added `CLAUDE.md` = process/working agreement: worklog-every-turn, commit+push each
  unit, migrations-only SQL, secrets/PII never in git, no fabricated data, polite scraping.
- Committed + pushed.
**Next:** SQLite→Supabase sync script; run FY2026 backfill.

## 2026-06-09 — Fresh Supabase + migrations + git/GitHub
**Asked:** Switch to the fresh Supabase project; set up DB migrations "like a pro";
actually commit & push (hadn't seen any commits yet).
**Done:**
- Switched `.env` to new project `fuerkvotxxiaiyfqevny` via the **IPv4 Session Pooler**
  (`aws-1-us-east-1.pooler.supabase.com`). Direct `db.*` host is IPv6-only → unreachable
  from Codespace. Old project `nesddzlkrgvnnhriauss` abandoned.
- New project was **empty (0 tables)** — clean slate, nothing to delete.
- Migration system: `supabase/migrations/0001_init.sql` + `scripts/migrate.py`
  (idempotent, tracks `schema_migrations`, Supabase-CLI-compatible layout).
- Applied 0001 → Supabase now has `projects`(36 cols), `status_history`,
  `user_project_state`; RLS enabled + locked down (service role bypasses).
- Newest-first scrape order verified: newest FY2026 record = TABS2026022344,
  **registered TODAY 6/9/2026**. One-year-at-a-time runs confirmed (resumable, no restart).
- Initialized git, committed, pushed to GitHub.
**Security:** user pasted DB password + service_role key in chat → stored only in
gitignored `.env`; advised rotating them in Supabase later.
**Next:** SQLite→Supabase sync script; run FY2026 backfill; then Next.js app.

## 2026-06-09 — Repo organized + resumable scraper built
**Asked:** Organize the repo with living progress notes; make the scraper crash/Wi-Fi
resumable; explain whether Claude Opus (or any model) is needed to run it.
**Done:**
- Created `README.md`, `docs/PLAN.md`, `docs/DATA_MODEL.md`, this worklog.
- Built `scraper/tabs_scraper.py`: resumable backfill → SQLite (`data/tabs.db`).
  Commits every fetch immediately; on restart skips done numbers. 4-parallel, retries.
- Documented the two key answers in PLAN §7 (resumability) and §8 (model):
  - Resumable: yes — safe against Wi-Fi drop / Ctrl-C / sleep. Re-run to continue.
  - **Running the scraper uses NO AI model** — plain Python. Opus only helps while
    *building* code; never touches the scraped data.
**Next:** Run the backfill (confirm year range: FY2021–2025 vs include partial FY2026).

## 2026-06-09 — Timing & volume measured
**Asked:** How long to scrape 1/2/3/4/5 years?
**Done:** Measured ~0.16s/request; ~22k–27k projects per fiscal year; ~154k total FY2021–2026.
Built estimate table (Balanced 4-parallel: ~20 min/yr, ~1.7 hr for 5 yr). See PLAN §9.

## 2026-06-09 — PoC parser validated + bugs fixed
**Asked:** Verify on a few projects that we capture all wanted data before running 200.
**Done:** Confirmed print view = 100% of available fields (diffed vs full project page).
Fixed two parser bugs (missing PROJECT fields; section bleed) by binding fields to each
`div.project-details-*` container. Confirmed status lifecycle values appear
(Project Registered / Review Complete / Inspection Complete / Project Closed).

## 2026-06-09 — Recon
**Asked:** Research TDLR/TABS and the Texas commercial process; review eliteinstall.net;
scope a scraper + lead pipeline.
**Done:** Confirmed TABS = enumerable server-rendered site, no bulk/open-data export,
print view holds all fields incl. owner/architect/RAS contacts. Chose stack:
Custom Next.js + Postgres; first step = PoC parse. Wrote `scrape_poc.py`.
