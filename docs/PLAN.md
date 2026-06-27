# PLAN — TABS Lead Engine (clean rebuild)

> Living architecture doc. Update when a decision changes. Progress lives in `WORKLOG.md`.
> v1 (Next.js app + 15-table schema) is archived on branch `v1-backup`.

## 1. Goal
Detect Texas TABS (Architectural Barriers) projects early in their lifecycle and turn
**status changes** into outbound leads (owner / architect / — later — GC). First customer is a
commercial flooring/fitness/retail install company; the core stays vertical-agnostic.

## 2. The moat (what we kept from v1)
Two hard-won pieces, both pure Python, no AI:
- **Backfill scraper** (`scraper/tabs_scraper.py`) — enumerate TABS project numbers, fetch the
  print view, parse ~33 fields, store in SQLite. Resumable (commits each fetch; skips done).
- **Daily engine** (`scripts/daily_update.py`) — see §4. The cheap index-diff that finds new
  filings + status changes without re-fetching everything.

## 3. Data source — key facts (verified in v1)
- No bulk export exists; scraping is the path. TABS is server-rendered ASP.NET.
- Project numbers are enumerable: `TABS{FISCAL_YEAR}{SEQ:06d}` (FY runs Sep–Aug).
- Best page = the print view: `https://www.tdlr.texas.gov/TABS/Search/Print/{pn}` (all fields).
- ~20–27k projects per fiscal year; ~154k total for FY2021–FY2026. ~0.16s/request.
- **TABS shows only the CURRENT status — no history on the page.** So the lifecycle timeline
  only exists if we snapshot daily and record every move ourselves. That's `status_history`.

## 4. How the daily engine works (the core loop)
1. **Index-scan** the active fiscal years via the TABS SearchProjects JSON API (100 rows/req).
   Each row already carries the project's current **status code** — cheap, ~minutes.
2. **Diff** each project's index code against the code we stored last run (`index_status_code`).
   - project number we've never seen → **NEW filing**
   - status code changed → **STATUS CHANGE** (this is the lead)
3. **Fetch the full detail page only** for new/changed (a handful/day) → upsert into `projects`.
4. **Log** a `status_history` row whenever the status actually moved.
5. Store today's index code for every scanned project so tomorrow's diff is clean.

The backfill is the same fetch run against *every* project instead of just the deltas.

## 5. Schema (clean core — `db/migrations/0001_core.sql`)
Two tables. Everything else is a later layer on top.
- **`projects`** — one row per project = latest scraped facts (~33 fields: identity, location,
  project/cost/sqft/status, owner, architect, RAS/filer/tenant) + bookkeeping
  (`raw_hash`, `index_status_code`, first/last_seen, last_changed).
- **`status_history`** — append-only `(project_number, old_status, new_status, changed_at)`.

## 6. Status lifecycle (the trigger)
`Project Registered → Review Complete → Inspection Complete → Project Closed` (plus
intermediate index codes catalogued in `tabs_index.STATUS`). Prime lead window for the
flooring use case: **Review Complete** (plans approved, heading to construction).

## 7. Roadmap (layer by layer — don't build ahead)
- [ ] **Core data** — backfill FY2021–2026 into Neon + flip on the daily engine. *(in progress)*
- [ ] **Verticals via lens** — a keyword include/exclude filter over project text (e.g. gym/
      fitness). A vertical/customer = a lens row, same `projects` table. No fork.
- [ ] **UI** — rebuild fresh on the clean schema, once the data layer is solid.
- [ ] GC bridge (address + architect → building-permit API) and contact enrichment — later.

## 8. Decisions
- **Neon over Supabase** — clean break, dev branching, scale-to-zero; we don't use Supabase's
  auth/RLS. Old data stays in Supabase as a backup; we re-scraped fresh into Neon.
- **Multi-vertical = data, not branches** — one repo, one DB, config layers. Git/DB branches
  are for experiments and backups only (e.g. `v1-backup`), never per-vertical product lines.
- **SQLite = durable scrape buffer; Postgres = source of truth.**
