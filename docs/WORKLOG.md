# WORKLOG — TABS Lead Engine

> Dated progress, newest at top. One entry per working session/prompt.

## 2026-06-27 — Clean rebuild: reset to core, move to Neon

**Asked:** Strategy reset. The scrape + daily engine are the keepers; the DB (15 tables) and
UI were a mess. Decided: switch to Neon, rebuild clean, run multiple verticals via config
(workspaces/lenses) rather than per-vertical branches. Go slow and understand each piece.

**Did:**
- Archived all of v1 (Next.js UI, 15-table schema, company/lens/inbox/list scaffolding, old
  docs) on branch **`v1-backup`** (pushed). Nothing deleted destructively — recoverable.
- Stripped `main` to the functional core: scraper, `tabs_index`, `daily_update`,
  `sync_to_supabase` (record→row mapping), `migrate.py`, the daily Action, `run_backfill.sh`,
  tests, requirements.
- Stood up **Neon** Postgres; wired `DATABASE_URL` into `.env`; verified connectivity
  (Postgres 18, IPv4 — no Supabase IPv6 issue).
- Wrote clean **2-table schema** (`db/migrations/0001_core.sql`: `projects` + `status_history`),
  moved migrations dir `supabase/` → `db/`, applied it to Neon. Tables live, empty.
- Launched the **one-time backfill** of all 6 fiscal years (FY2021–2026, ~154k projects,
  8 workers) in the background: index → scrape details → sync to Neon.
- Rewrote `CLAUDE.md`, `docs/PLAN.md`, `docs/WORKLOG.md` for the clean Neon + 2-table setup.

**Next:**
- Let the backfill finish (~55 min); verify row counts in Neon + `status_history` seeded.
- Point the daily Action's `DATABASE_URL` secret at Neon; confirm a daily run.
- Then (later layers): the gym/vertical lens, then a fresh UI.
- Cleanup: rename `sync_to_supabase.py` off the "supabase" name; update Action comments.
