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

## 4. Tabs (v1) — entity tabs, each clickable through
```
Projects · Monitor · Architects · Owners · Operators · Filers/RAS · GCs · Lists
```
- **Projects** — the main table (columns/filters per PROPOSAL_EXPLORER.md §3).
- **Monitor** — active projects + schedule health (§5 there).
- **Architects / Operators / Filers·RAS / GCs** — same template: table of entities with
  project counts, brands served, activity trend; click → full profile (their projects,
  who they repeatedly work with, contacts).
- **Owners** — same template PLUS shell-corp signals (below).
- **Lists** — the watchlists.
Every name inside any tab links to its profile; profiles link back to projects.

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
