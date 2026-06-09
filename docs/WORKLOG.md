# WORKLOG

> Chronological progress, newest at top. Updated every prompt so context is
> never lost. Each entry: what was asked, what was done, what's next.

---

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
