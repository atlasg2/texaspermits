# WORKLOG

> Chronological progress, newest at top. Updated every prompt so context is
> never lost. Each entry: what was asked, what was done, what's next.

---

## 2026-06-12 — Web app scaffold + auth + Projects table (task #4)
**Asked:** Build the app shell, magic-link auth, and the Projects table — with the
frontend-design skill.
**Done:**
- Next.js 16 (App Router, Turbopack) + Tailwind v4 in `web/`. Supabase clients: server
  (cookie/session), admin (service-role for data), browser (login). Auth gating via
  Next 16 `proxy.ts` (renamed from middleware) → unauth users to /login, verified 307.
  Two magic-link landings: `/auth/callback` (PKCE, real email) + `/auth/confirm`
  (token_hash). Sign-out route. Created Nick's auth user.
- **Design language "Field Terminal"**: blueprint/industrial — warm paper, ink, deep
  blueprint-blue primary, hi-vis amber for schedule risk, IBM Plex Sans+Mono, tabular
  numerals, uppercase mono micro-labels. Design tokens in globals.css; reusable Badge,
  PageHeader, Nav (5 tabs), AppShell sidebar.
- **Projects table**: server-rendered from Supabase (admin), 50/page with exact count,
  global search (project fields + company names), status/work-type filters, sortable
  columns (sqft/cost/completion/changed), derived Schedule badge (incl. Possibly Late),
  companies summary cell, clickable rows + company links. Placeholder pages for the other
  4 tabs.
- **Verified headlessly**: minted a session via admin generateLink → /auth/confirm →
  /projects renders 200 with real data (95,877 count, 50 rows, company links, schedule
  badges). Search confirmed working ("club 4" matches the Club 4 Fitness projects;
  brand has a space — "club4" rightly returns nothing).
**Next:** Task #5 — project detail page (Overview / Changes / Connections / Team Notes /
Lists) at `/projects/[project_number]`.

---

## 2026-06-12 — Company backfill done (73,490 companies, 193,118 links)
**Asked:** Build + run the company extraction backfill (task #2).
**Done:**
- 0003 migration: company identity = normalized name alone (dropped the (norm,kind) key),
  so one company can be owner on A and tenant on B. Applied.
- `scripts/build_companies.py`: normalize = lowercase + collapse non-alphanumeric runs +
  trim. Dry-run showed strong merges (HKS 15 spellings, Chick-fil-A 14, Kimley-Horn 10).
  Ran for real: **73,490 companies, 193,118 project_companies links** across 95,877
  projects. Idempotent (ON CONFLICT DO NOTHING both tables).
- Verified: Dean Brent Barron Architect → the 4 CLUB4 boxes (Plano/Bryan/El Paso/Grapevine,
  55–63k sqft, correct values); 665 companies hold >1 role; CLUB4 Plano TABS2026018330
  links Barron(architect)/14SM TT Owner LLC(owner)/Kenneth Herring(tenant). Demo path intact.
**Next:** Task #4 — scaffold Next.js app in `web/` (frontend-design skill) + Supabase
magic-link auth + the Projects table.

---

## 2026-06-12 — Migration 0002 applied + build order revised
**Asked:** Build migration 0002. Then: do the daily engine / GitHub Actions LAST, and use
the frontend-design skill for all UI.
**Done:**
- Wrote `supabase/migrations/0002_app.sql` and applied it (idempotent: ran migrate.py
  twice, 2nd is a no-op). New tables: companies, project_companies (sourced relationships
  w/ role+confidence+research_state), project_versions (content-hash snapshots),
  project_changes, project_schedule, workspaces (seeded Elite + fitness lens jsonb),
  inbox_items, lists (+seeded Watchlist/Follow-Up), list_items, notes. RLS on all:
  authenticated reads everything, writes only notes/list_items/inbox_items; service-role
  bypasses. Verified seeds + 10 tables + policies landed.
- Revised build order in `V1_BUILD.md §7`: **daily engine + GitHub Actions is now LAST**
  (app gets built/demoed on real data first; the demo's change-history & inbox come from
  the backfilled project_changes, no live engine needed). **All UI built with the
  frontend-design skill** — recorded as a hard requirement.
**Next:** Task #2 — `scripts/build_companies.py`: populate companies + project_companies
across the 95,877 projects; print dedupe clusters to sanity-check the normalizer.

---

## 2026-06-12 — Consolidated V1 build plan (`docs/V1_BUILD.md`)
**Asked:** Re-read `PLAN.md` + the two Codex proposals and give an updated plan to build.
**Done:**
- Verified data ground: Supabase now **95,877 projects** (FY2023 25,888 · FY2024 25,381 ·
  FY2025 25,671 · FY2026 18,937), **all** rows have corrected sqft, status_history fully
  backfilled (95,877). Cleanup chain landed ~189 more filings than the 95,688 snapshot.
- Found our approved plan and `CODEX_V1_PROPOSAL.md` independently match — same 5 tabs,
  same rules-decide/AI-writes split, same Views incl. Possibly-Late. Confirms the shape.
- Pulled 3 cheap-now/expensive-later upgrades from `CODEX_PRODUCT_PROPOSAL.md` into the
  V1 schema: (1) `project_versions` + content_hash → derive `project_changes`;
  (2) companies as sourced relationships (role/source/confidence/is_primary), not fixed
  columns; (3) GC research-state + computed schedule-state enums. Everything else from the
  big proposal explicitly deferred (§9).
- Wrote `docs/V1_BUILD.md` = the single doc we build from (workstreams A–D, build order,
  verification demo path, deferred list).
**Next:** Task #1 — write `supabase/migrations/0002_app.sql` per §3, apply, run twice for
idempotency. Then company backfill (B).

---

## 2026-06-12 — ✅ BACKFILL COMPLETE: FY2023–2026, 95,688 projects in Supabase
**Asked:** Finish the 36-month backfill; fix sqft at the end.
**Done:**
- Backfill ALL DONE 05:25 UTC: 70,148 detail pages fetched this run (zero wasted —
  index-driven), 24 errors auto-retried, final sync upserted **95,688 projects**.
  Local: FY2026 18,848 · FY2025 25,661 · FY2024 25,371 · FY2023 ~25,808.
- Ran repair_square_footage.py: **50,324 sqft values corrected** from raw strings;
  cost recompute: only 3 rows needed fixing. Tests pass (4/4).
- Committed the parallel Codex session's parser fix + repair script + tests + its
  PROPOSAL_EXPLORER.md blueprint rewrite (681d059).
- Launched final cleanup chain (background): index refresh (fills ~200 gap rows +
  filings since 02:00) → catch-up scrape → full re-sync (pushes corrected numbers
  to Supabase).
**Next:** verify final counts vs API totals; re-run emerging-operators query with true
sqft (correct the Devon Arnold claim); daily watcher on GitHub Actions; V1 app build.

## 2026-06-12 — PLATFORM.md v2: merged spec (Codex blueprint + platform plan)
**Asked:** Liked the Codex doc (PROPOSAL_EXPLORER.md) more overall — esp. the
work-queue/inbox idea — but it was hard to read; redo PLATFORM.md as a cleaner merged
version keeping the best of both.
**Done:** Full rewrite of `docs/PLATFORM.md` as the working spec (declared: it wins on
conflicts). Kept from Codex: the six questions, Route-to-Elite section, build-type-with-
evidence, Monitor health states + field confirmation, account pattern interpretations
in plain English (EOS worked example), Directory normalization, Find-GC workflow w/
5-place auto-propagation + priority order, four data layers, V1/V2/V3, success test.
Kept from mine: core-vs-workspace split (Elite = config row), shell-corp signals,
GitHub Actions daily engine, Lists, no-dead-ends rule. New: **Inbox tab** — daily
triage feed (new matches / status changes / flags / research tasks / watched updates),
actionable per line, later becomes the email digest. Tabs now:
Inbox·Projects·Monitor·Accounts·Directory·Research·Lists. Written in short plain
sentences per Nick's readability feedback.
**Next:** Nick approves spec → V1 build (after backfill repairs + daily engine).

## 2026-06-12 — Platform doc: generic core + per-company workspaces
**Asked:** Architecture for "useful to many companies, custom for Elite": daily-updating
core, table views w/ stage/late filters, per-account filters (e.g. Elite min-sqft),
entity tabs (Projects/Architects/Owners w/ shell-corp hunting), clickable throughout,
"add to a thing", options for the daily run.
**Done:** `docs/PLATFORM.md` — core (daily index-diff engine, entity graph w/ name
normalization, monitor rules, search, research queue) vs workspace config (vertical
dictionary, size floor, saved views, watchlists, alert rules, entity tags; Elite =
first config row, never a fork). Tabs: Projects·Monitor·Architects·Owners·Operators·
Filers/RAS·GCs·Lists. Owners tab shell signals (address-like LLC names, single-project
owners, shared mailing address/phone grouping; TX SOS/OpenCorporates later). Daily-run
options compared: GitHub Actions cron recommended (free, serverless, survives sleep)
vs pg_cron/VPS/manual. Deleted my redundant APP_SPEC.md draft (other session's
PROPOSAL_EXPLORER.md rewrite is the page-level blueprint; PLATFORM.md generalizes it).
**Next:** approve → daily engine on Actions first, then Projects+Monitor tabs.

## 2026-06-12 — Expanded software blueprint: tabs, pages, and connections
**Asked:** Put the proposal in a document and explain clearly what tabs/pages the
software has and how projects, accounts, people, GCs, research, and delay monitoring
connect.
**Done:** Replaced `docs/PROPOSAL_EXPLORER.md` with a full product blueprint. It now
defines five primary tabs (Projects, Monitor, Accounts, Directory, Research), every
major table/detail page, click behavior, saved views, evidence-backed GC entry, schedule
flags plus field confirmation, account relationship interpretation, data layers, an
explicit record-connection diagram, phased build order, and a plain success test.
**Next:** Review/approve this information architecture before designing or building UI.

## 2026-06-12 — Proposal: explorer + GC column + slip detection
**Asked:** Written proposal (not execution): interactive explorer w/ clickable entity
history + search by any name; blank general_contractor column filled via permits;
don't map gyms by developer (CLUB4 converts existing big boxes — all 3 projects are
Renovation/Alteration); flag projects behind schedule from start/est-completion dates
(known validation case: the current CLUB4 build Nick visited — CEO on site, badly late).
**Done:** `docs/PROPOSAL_EXPLORER.md`: (A) data completion + gc column w/ gc_source
labeling, free 10-project manual permit pilot before paying for Shovels; (B) Datasette
internally first, partner app after — pipeline table, entity pages, builders page
scored volume×stack-looseness×growth, search-everything; two build modes (conversion
brands vs ground-up) + big-box-renovation lens ⚠ for unbranded conversions; (C) slip
detection tiers (Past Due / Likely Slipping ⚠ / Severely Late) w/ honest caveats,
validated against the known-late CLUB4 site; demo storyline + execution order.
**Next:** backfill done → repairs → Datasette up → GC pilot → slip-flag prototype.

## 2026-06-12 — sqft parsing bug documented (docs/ISSUE_SQFT_NUM.md)
**Asked:** Status check on backfill; document the square-footage finding + fix plan.
**Done:** Backfill on track (20k/70,148 @ 6/s, ETA ~05:45 UTC; FY2025 done locally
25,661/25,671; Supabase 44,540). Documented the `to_int` bug: "40,000 ft 2" → 400002
(ft² superscript baked into every square_footage_num). Fix is in scraper code but the
running pass still writes old values; raw strings stored ⇒ repair = recompute, no
re-scrape. Plan in `docs/ISSUE_SQFT_NUM.md`: fix_numeric_cols.py recompute → verify →
re-sync → correct playbook (Devon Arnold actually ~3.5–5.8k sqft, not 35–58k) → to_int
unit test. Supabase carries the same bad column (sync copies num directly — verified).
**Next:** backfill completes → run the fix plan steps 1–5 → cleanup index pass →
final count verification.

## 2026-06-12 — Correction: separate data from assumptions in playbook
**Asked:** (Pushback) Explain the smaller-guys method plainly; stop stating unverified
industry assumptions ("PF locked", "EOS RFP-winnable", "no incumbent") as conclusions;
think it through and investigate instead.
**Done:** Playbook fixed — §D now lists the 6-step method explicitly and flags surfaced
names as *unidentified* pending investigation; §2b incumbent claims relabeled
"⚠ HYPOTHESES, NOT DATA" with the verification path: (a) ask Elite partners who floors
each chain today, (b) call the fingerprint architects (they write the spec, know the
vendor), (c) GC lookup on sample projects via permits. Only velocity numbers are data.
Standing rule going forward: every doc splits "data shows" vs "hypothesis ⚠"; methods
written as numbered plain steps; jargon defined inline.
**Next:** unchanged (backfill → extraction → partner package), plus: investigate the
surfaced names (Devon Arnold etc.) properly before using them.

## 2026-06-12 — Emerging operators + big-8 qualification angles
**Asked:** How to find smaller gym operators (grow-with targets); what to ask about the
big 8 orgs given Elite does flooring AND equipment install; web app w/ filters confirmed
as direction.
**Done:** Proved emerging-operator method on partial data (group by tenant/owner/contact,
exclude brands+public, 2–5 projects, 5–80k sqft): surfaced Devon Arnold (5 projects,
5 metros), Jessica King (3), Mike Manning (2), + Life Time (8 — add to brand dict).
Added playbook §D (emerging operators, velocity alert: 3rd registration in 12mo) and
§2b (big-8 qualification: how they buy GC vs owner-direct FF&E; incumbent risk — PF
locked/EOS RFP-winnable/family=relationship/Amped=no incumbent; pitch-the-pipeline;
renovation cycle as separate lead stream). Key context recorded: Elite already does
CLUB4 flooring nationwide ⇒ reference client. Backfill ~10% (5.5k+/70,148, ETA ~3h).
**Next:** backfill completes → full gym extraction FY2023–2026, partner package (live
board + who-to-call + trends); then daily watcher (GitHub Actions); then web app design.

## 2026-06-12 — Fitness playbook v0 (targets, sqft lens, nationwide, GC bridge)
**Asked:** Plan what to show Elite for fitness; who to target (franchise vs corporate);
nationwide view once brand structure is learned; GC discovery (Shovels.ai/BuildZoom);
sqft filter (costs unreliable); norm: validate theories across multiple cases.
**Done:** `docs/FITNESS_PLAYBOOK.md` —
- Buyer taxonomy: corporate chains in TX expansion (EOS, CLUB4, Amped=new entrant, Fitness
  Connection, Club Studio) / mega-franchisees (Crunch TX = CR Fitness ~100 clubs + 9 new TX
  sites by EOY 2026, Undefeated Tribe 41→100 by 2028, Fitness Ventures 115 units — already
  in our data as Crunch Odessa owner) / public ISD+muni gyms as separate lens. Small-box
  franchises deprioritized.
- **Sqft > cost, proven**: CLUB4 = tight 56–63k sqft box while costs flatline at round
  $3–3.5M; Crunch same-size boxes report $1.2M–4.9M. Classify on sqft bands; outlier
  bounds both fields. EOS now shows 8+ TX projects as FY2024 backfill lands.
- Nationwide: TABS=TX lab to learn fingerprints; Shovels.ai (1,800+ jurisdictions, ~85% US
  pop, API ~$599/mo) / BuildZoom amplify them nationally (search architect name → brand
  buildouts in any state).
- GC bridge: TABS lacks GC; city building permits name it. Lifecycle: registration (get
  specified w/ architect) → status change (construction soon) → permit match (bid the GC).
- Working rule added: every theory validated across ≥3 independent brands before it
  drives outreach/product.
**Next:** when backfill done — brand×quarter trends, fingerprint dictionary table,
owner-address clustering, timing model; Shovels trial eval on ~20 known projects.

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
