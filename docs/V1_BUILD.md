# V1 Build — Gym Project Intelligence App (consolidated implementation plan)

> Merges the approved plan (`~/.claude/plans/...`), `CODEX_V1_PROPOSAL.md`, and the
> worthwhile schema upgrades from `CODEX_PRODUCT_PROPOSAL.md`. This is the doc we build
> from. Process rules live in `CLAUDE.md`; architecture context in `PLAN.md`.

## 0. Where we are (verified 2026-06-12)
- **95,877 projects** in Supabase — FY2023 25,888 · FY2024 25,381 · FY2025 25,671 ·
  FY2026 18,937 (Sept 2022 → today, the 36 months Nick asked for).
- Every project has a corrected `square_footage`; `status_history` is fully backfilled
  (95,877 rows). The `ft²` parser bug is fixed and the 50k bad values were repaired.
- Data phase is **done**. Everything below is the app.

## 1. What the product is (settled — both plans agree)
Five tabs: **Inbox · Projects · Companies · Views · Lists**.

> Every day the system reads TABS, puts the new/changed gym projects in an **Inbox**,
> explains what changed, lets the team click through the full project and every
> connected company, and save records to a **Watchlist** or **Follow-Up**.

Rules of the product (non-negotiable, from Nick's feedback):
- **Rules decide facts; AI only writes sentences.** Keyword/brand rules decide what's a
  gym and what changed. AI (last step, feature-flagged) writes the one-line summary —
  never a conclusion. Fact bullets always stay visible under any AI text.
- **Unknown is shown as unknown.** Blank GC, blank tenant → visibly blank, never guessed.
- **TABS dates are estimates.** "Possibly Late" is an attention signal, not proof.
- **Tenant-agnostic core.** Elite is one *workspace* with one *lens* (keywords in the
  DB, not in code). A second customer = new workspace row, no code fork.

## 2. The three upgrades we're taking from the bigger Codex proposal
These are cheap to put in the schema now and painful to add after data exists:

1. **Project versions, not ad-hoc change writes.** Store a raw snapshot + `content_hash`
   each time a project's content changes; *derive* `project_changes` from comparing
   versions. This gives us provable "exactly what changed and when we saw it" and means
   the daily engine never has to guess what to diff.
2. **Companies as sourced relationships, not fixed columns.** One company can be an owner
   on one project and a tenant on another. The link row carries `role`, `source`,
   `confidence`, `is_primary`. The UI still shows an "Owner / Tenant / Architect / GC"
   summary, but the data model doesn't assume one-of-each.
3. **A real GC research state + schedule state.** GC is empty in V1, but the field gets a
   state (`unknown · researching · possible · confirmed · not_found`) so "possible" and
   "confirmed" never look the same. Schedule state (`upcoming · active · possibly_late ·
   complete · unknown`) is computed once and drives both the Projects column and the
   Possibly-Late view.

Everything else from the big proposal (evidence table, people graph, research queues,
shell-company groups, second workspace UI, email digests) is **deferred** — recorded in
§7, not built now.

## 3. Workstream A — Database (migration `0002_app.sql`, via `scripts/migrate.py`)
Idempotent, forward-only. Tables:

- **companies** — `id`, `canonical_name`, `name_variants text[]`, `kind`
  (owner|tenant|architect|gc|filer), `phone`, `address`, timestamps. Normalize for
  matching: trim → collapse spaces → casefold → strip trailing punctuation; keep the
  original strings in `name_variants`.
- **project_companies** — `project_number`, `company_id`, `role`
  (owner|tenant|architect|gc|filer), `source` (default `tabs`), `confidence`
  (default `confirmed`; gc rows will be `possible`/`confirmed` later), `is_primary bool`.
  GC role exists but is empty in V1.
- **project_versions** — `id`, `project_number`, `content_hash`, `snapshot jsonb`,
  `captured_at`. One row per content change. Backfill: one version per existing project.
- **project_changes** — `project_number`, `field`, `old_value`, `new_value`, `kind`
  (new_project|status|start_date|completion_date|cost|sqft|scope|company), `changed_at`.
  Backfill: one `new_project` row per project (first-seen) + copy `status_history` into
  `status` rows.
- **project_schedule** (or a computed column/view) — `project_number`, `schedule_state`,
  `computed_at`. Recomputed by the daily engine.
- **workspaces** — `id`, `name`, `lens jsonb`. Seed one Elite row: include-keywords
  (fitness, gym, health club, athletic + brand list), exclude-keywords (sam's club,
  ISD/school gymnasium, hotel/apartment amenity, physical therapy), `min_sqft` (a
  filter, not a gate).
- **inbox_items** — `id`, `workspace_id`, `project_number`, `reason` (machine code),
  `reason_bullets text[]` (human fact lines), `ai_summary` nullable, `state`
  (new|reviewed|dismissed), `created_at`, `acted_by`.
- **lists** — `id`, `workspace_id`, `name`. Seed **Watchlist** + **Follow-Up**.
  **list_items** — `list_id`, `project_number` nullable, `company_id` nullable, `note`,
  `added_by`, `assigned_to` nullable, `due_date` nullable, `resolved bool`.
- **notes** — `id`, `entity_type` (project|company), `entity_id`, `author`, `body`,
  `mentions text[]`, `resolved bool`, `created_at`. A mention also inserts an
  `inbox_item` (reason `mention`) for the mentioned user.
- **RLS**: `authenticated` may read everything; insert/update on `notes`, `list_items`,
  `inbox_items.state`, `user_project_state`. Server components use the service-role key;
  RLS is the backstop. Signups disabled; 3 users created by hand (Nick, Aaliyah, Sol).

Verify by running `migrate.py` twice (second run = no-op).

## 4. Workstream B — Company backfill (`scripts/build_companies.py`, one-off)
Walk all 95,877 projects → upsert `companies` + `project_companies` for owner / tenant /
architect (design_firm) / filer. Reuse the psycopg2 patterns from
`scripts/sync_to_supabase.py`. **Print the top-N near-duplicate clusters** so we can eyeball
the normalizer before trusting it — the James E. Stroh variants *must* collapse to one
company, the Dean Brent Barron projects *must* group. Unit-test the normalizer.

## 5. Workstream C — Daily engine (`scripts/daily_update.py` + `.github/workflows/daily.yml`)
GitHub Actions cron ~06:00 CT (secrets in repo Actions secrets, not a Codespace). Steps:
1. Index-scan FY2025 + FY2026 (~450 req) reusing `scripts/tabs_index.py`; a **weekly**
   full 4-year sweep catches stragglers and scope/sqft edits the index can't see.
2. Diff index fields vs Supabase per project (new PN / status / start / completion / cost).
3. For each new/changed PN: fetch the detail page (reuse `tabs_scraper.fetch_one` +
   parse), compute `content_hash`. If changed → write a `project_versions` row, upsert
   `projects`, derive `project_changes`, update `project_companies`, append
   `status_history`.
4. Recompute `schedule_state` for active projects.
5. **Inbox generation**: a lens-matching new project, or any tracked change on a
   lens-matching project, → one `inbox_item` with plain `reason_bullets`
   ("Completion changed Aug 1 → Sept 15", "58,854 sqft renovation", "Known CLUB4 pattern").
6. Idempotent: a second run the same day writes nothing new.
   *Known V1 limit (documented):* scope/sqft-only edits aren't in the index, so they're
   caught by the weekly sweep, not the daily one.

## 6. Workstream D — The app (`web/`, Next.js App Router + Tailwind on Vercel)
**Build every page with the `frontend-design` skill** — this is a requirement, not a
nicety. Pages, exactly per spec:

- **Inbox** — new/changed cards: project · city · why-it-appeared · last change · sqft ·
  cost · completion, with **Review / Dismiss / Add-to-List**. Review marks it reviewed and
  opens the project; Dismiss drops the event only (project returns on the next important
  change); reviewed/dismissed items leave the queue.
- **Projects** — the full table: project · city · status · schedule · type · sqft · est.
  cost (tooltip: "filer's estimate — unreliable") · scope (first line) · start ·
  completion · last change · companies summary. Global search (names, companies, city,
  scope, project #). Row → detail. Save current filters as a View; multi-select → Add to
  List.
- **Project detail** — `Overview · Changes · Connections · Team Notes · Lists`. Changes
  reads `project_changes`; Connections shows clickable company cards with GC = its
  research state; Team Notes supports @mentions; Lists shows membership + add/remove.
- **Companies** — sub-tabs `All | Owners | Tenants | Architects | GCs`. Table: company ·
  type · project count · active count · recent projects · cities. Detail: identity ·
  project history · **connected-companies table** (relationship + shared-project count,
  no graph) · team notes.
- **Views** (system-defined; code + lens config, not user rows):
  *New/Changed Gym · Active Gym · Recently Completed Gym (90 days) · **Possibly Late Gym***
  (completion date passed, status not terminal — shown with the "TABS dates are estimates"
  caveat). Sqft over/under is a **chip inside** a view, not its own view.
- **Lists** — Watchlist + Follow-Up (Follow-Up items have assignee + due date + resolved);
  users may create custom lists.
- **Auth** — Supabase magic link, middleware-gated, 3 allowlisted users, signups off.

## 7. Build order (revised — daily engine LAST, frontend-design skill for all UI)
The app gets built and demoable on real data first; the daily-refresh automation is the
final piece. **Every UI page is built with the `frontend-design` skill** (no generic AI
look). Order:
1. Migrations (A) ✅ — `0002_app.sql` applied.
2. Company backfill (B) — populate companies + project_companies from the 95,877 projects.
3. **Projects table** (frontend-design) — the spine of the app.
4. **Project detail** (frontend-design) — **deploy to Vercel here (demoable on real data)**.
5. **Companies** tab + detail (frontend-design).
6. **Views** + **Inbox** + **Lists** pages (frontend-design). For the demo, change-history
   and inbox items come from the backfilled `project_changes` (status_history) — no live
   engine needed yet.
7. **Notes / @mentions** (frontend-design).
8. **Daily engine (C)** — `daily_update.py` + GitHub Actions cron. Built LAST so the app is
   already proven; this just keeps it fresh going forward.
9. **AI inbox summaries** — feature-flagged, Claude API, language-only. Very last.

## 8. Verification (the demo that proves it)
- Migrations run twice cleanly. Unit tests for name-normalization + inbox rules next to
  `tests/test_tabs_scraper.py`.
- `daily_update.py` run once by hand: finds today's real new filings, writes
  `project_versions` + `project_changes` + `inbox_items`, idempotent on a second run.
- App smoke path: open **CLUB4 Plano `TABS2026018330`** → Overview correct → Changes shows
  history → click **Dean Brent Barron** → his projects → back → Add to Watchlist →
  @mention Sol → it lands in Sol's Inbox. **Possibly Late** view flags the known-late
  **CLUB4 Montwood `TABS2025022210`**. Run `/verify` + screenshots before showing Nick.
- Vercel preview: magic-link login with an allowlisted email works; a non-listed email is
  rejected.

## 9. Deferred (recorded, not forgotten)
Evidence/confidence table for non-source facts · people graph & person profiles ·
Research queues + manual GC auto-fill (manual GC entry only in V1) · shell-company group
detection · second-workspace UI & customer lens builder · email/text digests · schedule
sub-states (severely late, confirmed-delayed) · Shovels/permit GC bridge · Apollo contact
enrichment · nationwide / multi-state sources.
