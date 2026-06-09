# Elite Lead Engine — Part 1 Build Spec (V1)

> Hand this to the coding agent as the source of truth. Reference it from `CLAUDE.md` and `AGENTS.md`.

## 1. Context (why this exists)

Elite Installation Services is a national commercial flooring + fitness-equipment install company. It wins work from gym chains, general contractors (GCs), and equipment makers, and staffs jobs with local crews. **Goal of this tool:** mine free public building-permit data to produce (a) a live list of commercial buildout jobs to bid *now*, and (b) a ranked list of GCs worth a standing relationship — so Elite’s team can bring in net-new business.

This is **Part 1**: a permit engine over open-data cities. Broad commercial scope, with fitness tagged as a high-priority subset (Elite’s sharpest story — they install gym flooring/equipment, e.g. recent Club Four Fitness builds).

## 2. Scope (V1)

- **Cities:** Austin, Dallas, Houston (all Socrata open data). MUST be architected so adding a city = a config edit, nothing more.
- **Verticals:** all flooring-relevant commercial work; **tag** each permit by vertical (fitness, retail, restaurant, medical, office, other) and flag fitness.
- **Two outputs:** Active Pipeline (live jobs) + Historical GC Leaderboard (relationship targets).
- Out of scope for V1: the dashboard (separate workstream, Claude-built; this engine just emits clean CSV + JSON for it to read).

## 3. Architecture — build city-agnostic from day one

```
core/
  socrata_client.py     # generic Socrata SoQL fetch w/ paging, app-token, backoff
  config.py             # loads config/*.yaml
  normalize.py          # contractor-name + address normalization
  tag.py                # vertical + brand tagging
  score.py              # warm-target score
  schema.py             # canonical row dataclasses
part1_permits/
  pull.py               # config-driven pull -> canonical rows
  views.py              # build Active Pipeline + Leaderboard
  run.py                # CLI entrypoint
config/
  cities.yaml           # per-city: base_url + field map (CONFIRMED at runtime)
  filters.yaml          # valuation floor, recency window, permit-class allow/deny
  brands.yaml           # brand list + vertical keyword map
```

One pull function, driven entirely by `cities.yaml`. Everything downstream is identical per city.

## 4. Data sources

- **Austin:** `https://data.austintexas.gov/resource/3syk-w9eu.json` (Issued Construction Permits, Socrata)
- **Dallas:** dallasopendata.com — locate the building-permits dataset, grab its `/resource/<id>.json`
- **Houston:** data.houstontx.gov — locate the permits dataset
- All Socrata SoQL: `$where`, `$limit`, `$offset`, `$order`. Optional app token via `SOCRATA_APP_TOKEN` env var.

## 5. STEP 1 (required first): inspect each city’s schema

Column names differ per city. For each city, fetch 1 row, print the keys, and map them into `cities.yaml` under canonical names: `desc, issued_date, address, zip, valuation, permit_class, work_class, status, contractor_name, contractor_phone`. **Never hardcode column names — drive them from config.**

## 6. Filters (what counts)

- **Flooring-relevant only:** permit class/type in {commercial finish-out / tenant improvement, new commercial, commercial remodel}. Exclude sign-only, MEP-only, demolition-only.
- **Match:** description contains a vertical keyword (`filters.yaml`) OR a brand (`brands.yaml`).
- **Valuation:** ≥ floor (default $100,000).
- **Active Pipeline:** issued in last 90 days AND status open *if a status field exists*; if not, recency is the proxy (a commercial buildout takes months).
- **Historical:** all dates from a configurable start (default 2018-01-01), any status.

## 7. STEP 2: normalization (unit-test this — the leaderboard depends on it)

- **Contractor name:** uppercase → strip punctuation → remove legal/common suffixes (`INC, LLC, CORP, CO, COMPANY, CONSTRUCTION, CONSTRUCTORS, BUILDERS, GROUP, LP, LTD`) → collapse whitespace. Then fuzzy-cluster near-duplicates. Keep both `gc_name_raw` and `gc_name_norm`.
- **Address:** normalize for dedup (street number + normalized street + zip).

## 8. STEP 3: tag vertical + brand

- `vertical` from keyword map in `filters.yaml`.
- `brand` from `brands.yaml` match in the description (big-box weighted: Planet Fitness, Crunch, EoS, Chuze, VASA, Club 4/Club Four, Gold’s, LA Fitness, Life Time, Anytime, etc.).

## 9. STEP 4: the two views

**View A — Active Pipeline** (one row per live opportunity):
`brand | vertical | is_fitness | city | address | zip | permit_date | est_open(=permit_date+4mo) | valuation | gc_name_norm | gc_name_raw | gc_phone | status | gc_leaderboard_rank | source_url`

**View B — GC Leaderboard** (one row per normalized GC):
`gc_name_norm | total_commercial | total_fitness | brands_built | cities | first_seen | last_seen | count_last_12mo | warm_score`

- **warm_score** (define in `score.py`): weighted blend of commercial volume, has-done-fitness (boost), recent-12mo activity, and in-target-geography. Document the formula in code comments.
- In View A, fill `gc_leaderboard_rank` by joining each live permit’s GC to View B — tells the sales team how warm each lead is.

## 10. STEP 5: contacts (optional, last, behind a flag)

- GC name/phone often already on the permit — use that first.
- Estimator email: infer the company email pattern + verify; only if needed.
- Apollo or paid enrichment: behind a `--enrich` flag, off by default (it costs).
- **PII:** never commit contact data to git.

## 11. Output

- Write to `data/out/` (gitignored): `active_pipeline.csv`, `gc_leaderboard.csv`, plus a `.json` mirror the dashboard can read.

## 12. Guardrails (do not violate)

- **No fabricated data.** Emit only counts/GCs actually present in the source. If a field is unknown, leave it blank — **never guess or infer a GC for a project.**
- Clearly label any inferred/unconfirmed field.
- Respect each portal’s ToS and rate limits: use the app token, page reasonably, back off on errors.
- Secrets in `.env` (gitignored), never in code or `CLAUDE.md`.
- Never commit `data/` (scraped permits or contacts).

## 13. Acceptance criteria (V1 is done when)

1. One command (`python -m part1_permits.run`) pulls all three cities and writes both output files.
1. Adding a fourth city requires editing only `config/cities.yaml`.
1. `normalize.py` has passing unit tests; spot-checking 5 GCs confirms their counts are right.
1. Active Pipeline shows real commercial + fitness permits from the last 90 days with the GC where the permit lists one.
1. Leaderboard ranks GCs with correct totals, vertical splits, and warm scores.
