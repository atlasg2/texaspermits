# The Product Spec (v2) — one platform, Elite first

> This is the working spec. It merges the Codex blueprint (PROPOSAL_EXPLORER.md) with
> the platform plan, rewritten to be readable. If the two docs disagree, this one wins.
>
> Writing rules used here: short sentences. One idea per section. Every abstract idea
> gets an example. Facts, enriched data, computed signals, and human notes are always
> kept separate and labeled.

## 1. What this software is, in six questions

When Aaliyah or Sol opens any project, the software must answer:

1. What is this project and what stage is it in?
2. Is it on time or possibly behind?
3. Who is connected to it — architect, owner, tenant, filer, GC?
4. What else have those people built?
5. Who could actually hire Elite here — and could one party award flooring AND equipment together?
6. What do we still not know, and what's the next action?

If a page shows data but doesn't help answer these, the page isn't done.

## 2. One platform, many companies

The software has two layers:

- **The core** — same for every customer. The data, the pages, the flags, the search.
  Nothing in the core is named "Elite."
- **The workspace** — one company's settings. Which projects matter to them (keywords,
  minimum square footage, counties), their saved views, their lists, their alerts.

Elite is the first workspace. Its settings will be something like: fitness keywords,
sqft ≥ 15,000 (confirm with partners), all of Texas, active stages first.
A second customer later = a new settings row. No new code.

## 3. The tabs

```
Inbox · Projects · Monitor · Accounts · Directory · Research · Lists
```

One global search box sits above everything. Type any name, phone, address, project
number, or word from a scope description — results group by type.

---

### TAB 1: INBOX — "what needs my attention today"

The daily starting point. One feed, newest first, grouped:

```
TODAY
  ● 2 new projects match your lens        [Crunch — McKinney · EOS — Plano]
  ● 1 status change                       [Club4 Plano: Review → Inspection Scheduled]
  ● 1 new schedule flag                   [Club4 Montwood: possibly late]
  ● 3 research tasks ready                [Find GC: EOS Little Elm + 2 more]
  ● 1 watched item updated                [★ "EOS push": status change]
```

Every line is clickable and every line can be acted on from here:
open it · add to a list · create a task · dismiss it.
When the inbox is empty, you're caught up. That's the whole point of the tab —
the system reads the data every day so a human doesn't have to.

(Later: this same feed becomes the morning email/text digest.)

---

### TAB 2: PROJECTS — every project, one row each

**Columns:** star · schedule health · stage · brand/account · project · city · work
type (new build / box conversion / remodel) · sqft · est. cost (always labeled "filer
estimate") · scope (first line; click to expand) · est. start · est. completion ·
architect · GC (blank until researched) · tenant · owner · filer · registered date.

**Filters:** stage · work type · sqft range · county · date range · health ·
new this week · status changed recently · missing GC.

**Clicks:**
| You click | You get |
|---|---|
| project name | Project Detail page |
| architect / tenant / owner / filer / GC | that entity's Directory profile |
| brand/account | that Account page |
| a blank GC cell | "Find GC" research task (see Research tab) |
| the star | add to a List |
| the health flag | Project Detail, scrolled to the schedule section |

Saved views appear as small tabs above the table. Start with only three:
*Active Gyms (design or permitting) · Possibly Late · New This Week.*
More views get created by the partners when real use demands them — we don't
pre-invent their workflow.

---

### PROJECT DETAIL — one project, everything known

Four blocks, top to bottom:

**A. Facts** (from TABS): number, names, address, dates, cost, corrected sqft,
work type, scope text, current status, and the full status history we've recorded.

**B. Build type, with its evidence shown:**
```
Build type: Existing-box conversion
Evidence:   TABS work type = Renovation/Alteration
            Scope: "Interior renovation of existing retail space…"
```
Why this matters: CLUB4 converts old big-box stores — the landlord changes every
time and usually doesn't pick the installer. For ground-up projects the developer
matters much more. The app must never treat those two the same.

**C. People** — clickable cards: architect, owner, tenant/operator, filer, RAS,
GC (or "not on file — Find GC"), plus enriched ones when known (franchisee,
equipment dealer, flooring dealer, known decision-maker).

**D. Route to Elite** — the money section. Plain questions, honest answers:
```
Flooring decided by:        unknown        ← research task
Equipment install by:       unknown        ← research task
One party can award both:   unknown
Most likely buyer:          EOS construction dept (⚠ hypothesis)
Best introduction:          architect (Stroh) or direct
Next action:                find GC on this + 2 sibling projects
```
No scores pretending to be facts. Just what we know, what we don't, and the next step.

**E. Notes** — calls, field observations, bid history, who at Elite owns it, next
follow-up date. Human knowledge never gets overwritten by scraped data.

---

### TAB 3: MONITOR — the schedule worry-list

Active projects only, sorted worst-first.

**Health states (computed, always labeled as estimates):**
- **Upcoming** — start date in the future
- **Active** — between start and completion dates
- **Stalled start?** — start date passed, still in an early stage
- **Possibly late** — completion date passed, not inspected/closed
- **Severely late** — 90+ days past completion, not done

Always shown with this warning: *TABS dates are the filer's estimates and status can
lag the jobsite. A flag means "check this," not "this is late."*

**Field confirmation** — a partner can overwrite the guess with ground truth:
```
System:    possibly late
Confirmed: LATE — by Aaliyah, 6/12 — "CEO onsite, opening at risk"
```
First validation case: the CLUB4 site Nick visited. If the system flags the project
the CEO is personally babysitting, the demo makes itself.

Why Elite cares beyond curiosity: a late project has a compressed finish-out —
exactly when one vendor doing floor + equipment in a single sequence saves an
opening date. We find the fires, and we're the extinguisher.

---

### TAB 4: ACCOUNTS — the buyers

An account = a party whose repeat work could mean repeat Elite jobs: a corporate
chain (EOS), one specific franchisee group (each Crunch group separately — never
assume brand = one buyer), a regional operator, a developer behind many shells,
a repeat GC.

**Table:** account · type (corporate / franchisee / unknown ⚠) · total projects ·
active · 12-month trend ▲▼ · build pattern (ground-up / conversions / mixed) ·
main architect · main GC (when known) · next action.

**Account page** answers four things:
1. **Pipeline** — their projects, on a map of stages. ("EOS: 8 active in TX.")
2. **Their crew** — architects, GCs, filers they reuse, with counts.
3. **How they appear to buy** — centralized or per-project? Who picks flooring?
   Who picks equipment? Each answer is *known (with source)* or *unknown (with a
   research task)*. Never guessed silently.
4. **What pattern means what** (plain-English interpretation, auto-generated):
   - *Same architect + same filer, owners always different* → process is centralized;
     landlords don't matter; chase the operator's construction team.
   - *Same operator, different GCs each time* → GC chosen per project; every project
     is individually winnable; timing alerts matter most.
   - *Same everything* → one locked channel; a bad cold-call target but a huge
     account; watch for trigger events (new metro, velocity spike, first project
     with a different GC — the system flags these automatically).
   - *Small operator, repeat projects, same person every time* → possibly the
     highest-probability buyer of the combined floor+equipment offer; one person
     can say yes to both.

Worked example the data already supports: EOS = one architect on nearly every
project, one repeat filer, owners all different → centralized design, landlords
irrelevant. Who picks flooring? Unknown → that's a research task, and EOS is a
research priority, not yet a "high-probability sale."

---

### TAB 5: DIRECTORY — every person and company, with history

Sub-tabs: **Architects · Owners · Operators/Tenants · Filers & RAS · GCs · Contacts**

All share one profile template: canonical name (variants preserved — "Stroh, Inc"
vs "Stroh , Inc." = one profile), contact info, every project, brands served,
who they repeatedly appear with, notes. Every name on a profile is a link.
**No dead ends, ever** — any fact is one click from the records behind it.

**The Owners sub-tab also hunts shell companies.** Five signals, each shown with
its evidence, combined into a "likely shell ⚠" badge:
1. Address-like LLC name ("11705 Montwood LLC" owning 11705 Montwood)
2. One-and-done owner (exactly one project, ever)
3. Many owner-LLCs sharing one mailing address → grouped: "this address controls
   14 LLCs → see all their projects together" (that group = the real developer)
4. Shared phone across "different" owners
5. Owner ≠ tenant ≠ facility name (landlord, not operator)
Later (not v1): Texas Secretary of State / OpenCorporates lookups turn
"likely shell" into "controlled by X."

---

### TAB 6: RESEARCH — blanks become a work queue

Queues, not chaos: missing GC · unknown franchisee identity · unknown decision-maker ·
unknown flooring/equipment award authority · schedule flag needing field confirmation ·
duplicate names needing merge.

**The Find-GC workflow** (the biggest queue — TABS never names the GC):
1. Click "Find GC" on any project → a panel shows the address, dates, jurisdiction,
   architect, operator, and direct links to that city's permit search.
2. You find the permit → save: GC name, permit number, source URL, date, who
   researched, confidence (confirmed / possible).
3. A confirmed GC then appears automatically in five places: the project row,
   the Project Detail, the GC's profile, the operator's Account page, and the
   relationship counts ("GC X has built 6 EOS projects").

**Priority order** (don't fill history first):
active projects fitting both Elite services → completion date near/past →
repeat operators → projects of high-volume architects → everything else.

Pilot before paying: ~10 manual lookups on Dallas/Houston/San Antonio portals.
If 6+ of 10 succeed, consider automating (per-metro matching or Shovels.ai trial).

---

### TAB 7: LISTS — the things you're chasing

Star anything anywhere → it lands in a named list with a note, who added it, when.
One default list: **"Chasing now."** Partners create others when they need them.
Anything on a list that changes status or gains a flag shows up in the Inbox
automatically. Lists are the seed of deal-tracking — no separate CRM needed yet.

**Team communication (replaces tags — there are no entity tags):**
- Every project and every profile has a **notes thread**.
- Type `@Sol` in a note → it lands in Sol's Inbox.
- Any "next action" can be **assigned to a person with a due date** → it appears in
  that person's Inbox when due.
Notes, mentions, assignments — that's the whole collaboration layer for v1.

---

## 4. The four data layers (never mixed, never overwriting each other)

| Layer | What | Example |
|---|---|---|
| Source facts | scraped from TABS | status, dates, sqft, names |
| Enriched facts | added from another source, source always stored | GC from permit #12345 |
| Derived signals | computed, formula always visible | "possibly late", shell score ⚠ |
| Human knowledge | typed by Elite, never auto-changed | "CEO onsite", bid results |

## 5. How records connect (why clicking works)

```
ACCOUNT (EOS)
   └── has many PROJECTS (EOS Little Elm, EOS Plano, …)
         each project links to → ARCHITECT, FILER, OWNER, TENANT, GC(when found),
                                 monitor record, research tasks, Elite notes
```
One entity, many projects — that's what builds history. Click "James E. Stroh" →
the system pulls every project linked to the normalized name and the history page
assembles itself.

## 6. The daily engine — how the Inbox gets filled

Two stages, every morning.

**Stage 1 — facts. Always a plain script, never AI.**
Runs on **GitHub Actions** cron (free at our volume, keys in encrypted secrets,
works while every laptop is asleep):
1. Light scan of the TABS index (~770 requests, minutes) → diff every status.
2. Fetch full details ONLY for new/changed projects (usually dozens).
3. Update Supabase + status history → recompute schedule flags.
Facts must be deterministic and auditable. (Alternatives — Supabase cron, $5 VPS —
considered and rejected for now.)

**Stage 2 — triage: deciding what deserves the Inbox. Three options:**

| Option | How it works | Verdict |
|---|---|---|
| **A. Rules only** | keyword lists + thresholds route changes ("contains 'fitness', ≥15k sqft → inbox") | cheap, predictable — but misses odd wording ("remodel into MMA training facility") and can't write summaries |
| **B. Rules + AI triage** | script finds changes; one Claude API call per new project reads the scope text, classifies it (vertical, build type, likely brand w/ fingerprint evidence + confidence ⚠), writes the one-line inbox summary | **recommended at launch** — pennies/day at our volume; AI only does language, never facts |
| **C. Full AI agent** | a scheduled cloud agent runs the whole loop, handles site changes/retries, drafts the digest, opens research tasks | most capable, costlier, harder to audit — revisit when volume justifies it |

Deployed shape: **Actions runs Stage 1 nightly → Option B triages → the Inbox is
full before anyone wakes up.** Every AI-written line carries its evidence and a
confidence label; anything below the confidence bar goes to a "needs review" pile
instead of being asserted.

## 7. Build order

- **V1 — usable research tool:** Projects table + filters + global search · Project
  Detail · clickable profiles · blank-GC manual entry with evidence · Monitor flags ·
  notes + field confirmation. *(This is the partner demo.)*
- **V2 — account intelligence:** name normalization · Accounts pages · relationship
  counts · Research queues · saved views · Inbox.
- **V3 — automation:** daily engine on Actions · email/text digest · assisted permit
  matching · contact enrichment · dealer/installer tracking.

## 8. The success test

Open any project. Can Aaliyah answer the six questions in section 1 without leaving
the app? Yes → it works. No → not finished.
