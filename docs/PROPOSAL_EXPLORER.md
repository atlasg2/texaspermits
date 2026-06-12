# Proposal: Gym Lead Explorer + GC fill + slip detection (v1)

> What to build next, in order. Proposal only — nothing here is built yet.
> Per our rules: every derived/inferred value gets labeled with its source;
> hypotheses marked ⚠ until tested on 3+ independent cases.

## A. Data completion (prerequisite, ~this week)
1. Finish FY2023–2026 backfill (tonight) → numeric repair (ISSUE_SQFT_NUM.md) →
   cleanup index pass → verify counts vs API totals.
2. **New column: general_contractor** (+ `gc_source`, `gc_found_at`) via migration.
   TABS never provides it; we fill it from city building permits, which do.
   - Step 1 (free pilot): manually look up ~10 known gym projects on Dallas/Houston/
     San Antonio permit portals. Measure hit rate + minutes per lookup.
   - Step 2 (if ≥6/10 hit): automate per-metro permit matching (address + date window),
     or trial Shovels.ai API and compare cost vs. building it ourselves.
   - Rule: `gc_source` always says where the name came from (permit #, portal, vendor).
     Never inferred, never blank-guessed.
3. Schedule fields already exist (start_date, estimated completion_date) — needed for C.

## B. The Explorer (internal tool first, partner app second)
Internal v0 = **Datasette over our SQLite** (zero build): every value clickable,
full-text search, facet filters. Purpose: let us test which views matter before
designing the partner app.

Partner app v1 (design AFTER a week of internal use):
- **Pipeline table** — gym projects; filters: stage, sqft band, brand, county,
  type of work, registration date. Every name in every row is a link.
- **Entity pages** — architect / owner / tenant / filer / RAS / GC. Click "James E.
  Stroh" → all his projects, brands served, co-occurring GCs and filers, timeline.
- **Builders page (the lead list)** — every org/person with 2+ gym projects, scored:
  `volume × stack-looseness × growth`. Loose stack (different architects/GCs per
  project) = winnable per-project. Tight stack = strategic account; watch for trigger
  events (new metro, velocity spike, first project with a different GC).
- **Search-everything box** across all name/contact fields.

### Two build modes — don't map gyms by developer alone
The data confirms two distinct patterns:
- **Conversion brands (CLUB4 model):** take existing big boxes and gut them. All 3
  CLUB4 projects are Renovation/Alteration of 56–63k sqft existing buildings. No
  developer, no ground-up. Detection lens: *"renovation/alteration, 35–70k sqft,
  retail address"* — this also catches UNBRANDED conversions early (a dead Kmart
  becoming a 50k sqft 'renovation' with a known gym architect = a gym before it has
  a name). ⚠ test the lens precision on full data.
- **Ground-up brands:** new construction, often developer/landlord build-to-suit —
  here owner/developer mapping DOES matter.
The explorer must filter by type_of_work everywhere, and the brand dictionary should
record each brand's build mode.

## C. Slip detection (monitoring flag — the CEO demo)
We hold each project's **estimated start date, estimated completion date, current
status, and the full history of status changes**. That's enough to estimate lateness:
- **Past due**: today > est. completion AND status not Inspection Complete/Closed.
- **Likely slipping** ⚠: >75% of the start→completion window elapsed AND status still
  in Registered/Review (hasn't even reached inspection pipeline).
- Tiers: At Risk / Late / Severely Late (>90 days past est. completion).
- Caveats, always shown: dates are the filer's estimates and may be stale; status can
  lag reality. This is a *flag for attention*, not an assertion. Thresholds tuned on
  full data, validated against projects whose lateness we know firsthand.
- **Validation case**: the current CLUB4 build (the one Nick saw, CEO on site, badly
  behind). If the flag catches the project the CEO is personally babysitting, that's
  the demo: *"our system flagged your problem site from public data."*
- Why Elite cares commercially: late project ⇒ compressed finish-out ⇒ exactly when
  a single vendor doing floor + equipment in one sequence saves an opening date.
  "We find the fires AND we're the extinguisher."

## Demo storyline for the partners (when we build the deck/app)
1. CLUB4 Plano — "did you know on April 22?" (we see their client's moves first)
2. Slip flag — "we flagged the site your CEO is camped at, from public data"
3. Live board + click-through — "every gym in Texas, in design or building, searchable"
4. Builders lead list — "ranked, by who's most winnable, including the small ones growing"

## Order of execution (proposed)
1. Backfill completes → repairs → verification        (tonight/tomorrow)
2. Datasette up internally; we explore + test lenses   (same day, zero build)
3. GC manual pilot (10 projects)                       (1–2 hrs, parallel)
4. Slip-flag query prototyped + validated on CLUB4 case (after repair)
5. Daily watcher (GitHub Actions) keeping it all fresh
6. THEN partner app design, informed by 2–5
