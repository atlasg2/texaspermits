# Platform: one core, many companies (Elite = workspace #1)

> How we build something useful to many companies while Elite gets a custom version —
> without forking anything. Companion to PROPOSAL_EXPLORER.md (which details the pages
> as Elite will experience them). Per CLAUDE.md: nothing named "Elite" in core code.

## 1. The split in one sentence
**Core platform** = the data, the tables, the clickable graph, the daily refresh, the
late-flags — identical for every customer. **Workspace** = a per-company configuration
(filters, thresholds, lists, alert rules) that decides what that company sees first.
A new customer is a new config row + maybe a new keyword dictionary — never new code.

## 2. Core (same for everyone)
- **Data engine**: daily index scan of TABS (~770 cheap requests for 3 fiscal years) →
  diff every project's status against our DB → fetch detail pages ONLY for new/changed
  (typically dozens/day) → append to status_history. Minutes of runtime per day.
- **Entity graph**: projects ↔ architects, owners, tenants/operators, filers, RAS, GCs
  (as researched). Names normalized to one profile (variants preserved). Everything
  clickable to a profile page.
- **Monitor rules**: schedule-health flags (upcoming / active / possibly late /
  severely late / complete / unknown) computed from TABS dates + status, always with
  the "estimates, not facts" caveat. Field-confirmation overrides.
- **Search**: one box across all names, phones, addresses, scope text.
- **Research queue**: blanks (e.g. GC) become tasks; answers carry evidence + source.

## 3. Workspace config (per company; Elite's first values)
| Setting | What it does | Elite's likely value |
|---|---|---|
| Vertical dictionary | keyword/brand sets that define "their" projects | fitness brands + gym terms + exclude-list (Sam's Club, school gyms…) |
| Size floor | hide projects below relevant scope | min sqft (e.g. ≥15–20k; confirm with partners) |
| Stage defaults | which stages the default view shows | Registered, Review Pending/Complete |
| Geography | counties/metros that matter | all TX (they travel) |
| Saved views | filter combos pinned as sub-tabs | "DFW gyms in design", "possibly late", "big-box renos" |
| Watchlists | named lists you ADD things to | "Chasing now", "CLUB4 sites", "Architect targets" |
| Alert rules | what lands in the daily digest | new gym ≥15k sqft; any watchlist item changes status; new slip flag |
| Entity tags | mark companies as client / target / competitor | CLUB4 = client; EOS = research target |

"Add it to a certain thing" = **watchlists**: a ⭐ on any project or entity anywhere in
the app adds it to a named list with a note. Lists are the seed of the CRM — they hold
follow-ups without us building a CRM yet.

## 4. Tabs (v1) — exactly what's on each and where every click goes
```
Projects · Monitor · Architects · Owners · Operators · Filers/RAS · GCs · Lists
```

### 4.1 PROJECTS (home tab — one row per project)
Columns: `⭐ | health flag | TABS stage | brand/account | project name | city | county |
work type (new/conversion/remodel) | sqft | est. start | est. completion | architect |
GC (blank until researched) | tenant | owner | filer | registered date`
Filters (top bar): stage · work type · sqft range · county/metro · registered-date range ·
health flag · brand · "new this week" · "status changed recently" · "missing GC"
Clicks:
- project name → **Project detail page** (full record, status timeline, slip math,
  people cards, notes)
- architect → that firm's profile (Architects tab template)
- owner → owner profile (Owners tab) · tenant → operator profile (Operators tab)
- filer → filer profile · GC (if filled) → GC profile
- blank GC cell → "research this" → creates a task (shows on the GC tab's queue)
- ⭐ → add to a watchlist (Lists tab)
- health flag → Project detail, scrolled to the schedule section

### 4.2 MONITOR (the daily worry-list — active projects only)
Columns: `health (possibly late / severely late / stalled start / active / upcoming) |
project | brand | city | est. start | est. completion | days past completion |
current stage | last status change | field confirmation | next check date`
Sorted worst-first. Same click rules as Projects (every name is a link).
Special here: **field confirmation** — a partner can mark "confirmed late / on time /
paused" with a note ("CEO onsite"); that overrides the computed guess and is shown
with who confirmed and when.
Connects to: Projects (same rows, different lens), Lists (⭐), Alerts digest (any
health change emits an alert).

### 4.3 ARCHITECTS (one row per design firm, names normalized)
Columns: `firm | total projects | active projects | brands served | repeat partners
(filer/RAS/GC most seen with) | typical sqft band | counties | last registration`
Clicks:
- firm name → **Architect profile**: all their projects (a mini Projects table,
  pre-filtered), brands breakdown, who they repeatedly file/build with, contact info,
  notes. Every project row and partner name clicks onward.
- any brand chip → that Operator profile · any count → the filtered project list
Why this tab exists: architects are the brand fingerprints (Barron→CLUB4 pattern) and
the "get specified" sales channel.

### 4.4 OWNERS (one row per owner entity + shell detection)
Columns: `owner | shell score ⚠ | projects | shared-address group (N LLCs) |
tenant overlap (same as tenant? y/n) | cities | work types | phone`
Clicks:
- owner name → **Owner profile**: their projects, the shell evidence list (which of
  the 5 signals fired, §5), and — the key link — "**N other LLCs at this mailing
  address →**" which opens the grouped real-developer view.
- shared-address group → that group view (all sibling LLCs + all their projects
  together = the real account)
Why: stop chasing landlords; find the real developer behind serial shells.

### 4.5 OPERATORS (brands & tenants — one row per operating company)
Columns: `operator | type (corporate / franchisee / unknown ⚠) | projects | active |
12-mo velocity ▲▼ | crew consistency (tight/loose) | typical sqft | main architect |
main GC (when known) | metros`
Clicks:
- operator → **Operator profile**: pipeline (their projects), repeated relationships
  (architects/GCs/filers with counts), build pattern (conversion vs ground-up),
  buying-process notes (evidence-based, unknowns listed), watch-triggers.
- main architect / main GC → those profiles
Why: this is the account/lead view — volume × consistency × growth lives here.

### 4.6 FILERS / RAS (who submits & reviews the paperwork)
Columns: `name | role (filer / RAS) | projects | brands seen with | repeat architects |
counties | phone`
Clicks: name → profile (same template: their projects + co-occurring entities).
Why: filers and RAS firms repeat across a chain's projects — a second and third
fingerprint to identify shell-owned projects (⚠ test on 3+ brands first).

### 4.7 GCs (starts mostly empty — fills via research)
Columns: `GC | confirmed projects | operators served | architects seen with |
work types | metros | source coverage (how many of their projects have evidence)`
Plus the **research queue** on this tab: every active project with a blank GC,
ordered by priority (watchlisted first), each linking to its permit-lookup task;
a filled answer must carry `gc_source` (permit #/portal/vendor).
Clicks: GC → profile · queue row → the project + its task.

### 4.8 LISTS (watchlists — the "add to a thing")
Each list = name + rows (projects or entities) + per-row note + who added it + date.
Defaults for Elite: "Chasing now", "CLUB4 sites", "Architect targets".
Clicks: any row → its project/profile page. Any status change or new flag on a
watchlisted item automatically lands in the Alerts digest.

### How the tabs connect (the loop you'll actually walk)
```
PROJECTS:  see "EOS Fitness, Little Elm, Registered 6/5"
   └─ click architect "James E. Stroh"
ARCHITECTS profile:  31 projects, 24 = EOS, repeat filer = (name)
   └─ click brand chip "EOS"
OPERATORS profile (EOS):  8 active TX projects, tight crew, velocity ▲
   └─ click "main GC: unknown — 8 projects missing GC → research"
GCs tab queue:  8 permit-lookup tasks created
   └─ first one filled (with permit # as source)
GC profile:  "XYZ Builders — 3 confirmed EOS projects"
   └─ ⭐ add XYZ Builders + the 8 projects to list "EOS push"
LISTS:  "EOS push" — now every status change on those projects alerts you
MONITOR:  one of them goes ⚑ possibly-late → call with the rescue pitch
```
Rule for every tab: **no dead ends** — every name, count, chip, and flag is a link;
anywhere you see a fact, one click shows the records behind it.

## 5. Owners tab: hunting shell corps
Computed signals, each shown with its evidence, combined into a "likely shell (SPE)"
badge — ⚠ heuristic, never asserted as fact:
1. Name pattern: LLC/LP/Trust suffix + address-like or project-like name
   ("11705 Montwood LLC" owning 11705 Montwood = near-certain SPE).
2. Single-project owner (one and done = created for the deal).
3. **Shared mailing address**: many owner-LLCs at one address = one real developer;
   the profile groups them ("this address controls 14 LLCs → see them all").
4. Shared phone across "different" owners.
5. Owner ≠ tenant ≠ facility name (landlord, not operator).
Later enrichment (not v1): TX Secretary of State / OpenCorporates lookups for
registered agents and officers — turns "likely shell" into "controlled by X".
Purpose: stop wasting attention on landlords; redirect to the operator/architect; and
reveal the real developer behind serial shells (those ARE accounts for ground-up work).

## 6. Daily updates — the options
| Option | How | Verdict |
|---|---|---|
| **GitHub Actions cron** | scheduled workflow runs index-diff + detail fetch + Supabase sync; keys in repo secrets | **Recommended.** Free at our volume, no server, survives laptop/Codespace being off |
| Supabase pg_cron + edge functions | all inside Supabase | runtime limits fit badly with scraping; revisit later |
| Small VPS (~$5/mo) | always-on box runs the scripts | fine fallback if Actions becomes limiting |
| Codespace manual | what we do today | not reliable as "daily" — Codespaces sleep |
Output of the daily run: updated tables + a digest (new matches per workspace lens,
status changes, new flags) → Alerts page now; email/text later.

## 7. Build order (platform view)
1. Daily engine on GitHub Actions (core #1 — everything else feeds on it)
2. Projects + Monitor tabs, read-only, Elite workspace config hardcoded as A config row
3. Entity tabs + profiles (Architects, Owners w/ shell signals, Operators, Filers)
4. Watchlists + alert digest
5. Research queue (GC fill) · 6. Second workspace = proof of generality

## 8. What stays out of v1
Multi-user auth/roles, email/SMS delivery, TX SOS enrichment, other states/sources,
map view, billing. All compatible with this design; none needed to demo.
