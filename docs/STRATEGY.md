# STRATEGY (v0 — not set in stone)

> These are current thoughts as of 2026-06-09, meant to evolve. Nothing here is a
> commitment — it's a starting POV to pitch from and refine as we learn. Update freely.

## TL;DR
TABS gives the early "a commercial project just started" signal — free, public, for every
Texas project ≥ $50k, with owner + architect contacts — the same early signal the national
platforms charge $5k–$12k/yr/seat to approximate. Nobody productizes this specific dataset.
The opportunity: **the early-warning system for Texas commercial construction**, sold cheap to
the subs/manufacturers the big tools price out.

## Landscape / competition (researched 2026-06-09)
- **No direct competitor** productizing TABS data as leads. Search only surfaced (a) the
  official TDLR system and (b) RAS/compliance firms (Texas Access, AccessPlanReview) that help
  you *file & inspect* — not sales intelligence.
- **National platforms** are the indirect comps, and they're slow/broad/expensive:
  - ConstructConnect ~$4.8k–$8.4k/yr/seat, daily human-researched.
  - Dodge ~$6k–$12k/yr/seat, **batch** updates; ~$100–150/mo to track one metro.
  - ~62% overlap between them → each misses ~1/3 of projects. Coverage is incomplete.

## Why the data is valuable (the thesis)
- The lead industry sells one thing: the **early signal**. Buying window opens 30–180 days
  before the RFP; ~92% of buyers have a vendor in mind before formal bidding ("the one who
  showed up before the RFP"). Architect appointment = concept→planning signal.
- **TABS captures exactly that**, at plan-review stage, *before* construction and often before
  GC/subs are locked — with the architect & owner contacts attached. Free vs $12k/yr.

## Who pays (customer segments)
1. **Specialty subs / trades** (flooring, fitness, roofing, glazing, signage, FF&E) — core
   buyer, same shape as Elite. Want on bid lists early.
2. **Building-product manufacturers / reps** — want the *architect* during design (spec-in).
3. **GCs** — want visibility into what's being designed locally.

## The moat (why timing matters)
Raw data is public, so the scrape alone isn't defensible. What accrues and *can't be backfilled*:
- **Status-change history** — TABS shows only *current* status; the registered→approved→
  inspected timeline exists only if recorded daily. We started 2026-06-09. Competitors can't
  reconstruct the past.
- **Architect→GC linkage** (permit bridge) — nobody does this for TX accessibility projects.
- **Contacts + enrichment + alerts + an affordable UX.**

## Product shapes (pick as we validate)
- **A. Vertical lead feed (SaaS):** daily new TX commercial projects, filters (trade/region/
  cost/status), contacts, status alerts, GC leaderboard. Recurring revenue. The scalable play.
- **B. Done-for-you leads:** curate + enrich + hand qualified leads in one niche. Faster cash,
  validates demand, less build.
- **C. Data/API licensing:** sell cleaned dataset/API to niche CRMs or the big players.

## Phased plan (de-risked)
- **Phase 0 — Use it for Elite (now).** Win real bids → proof + case study for the pitch.
- **Phase 1 — Niche paid pilot.** One vertical we know (fitness/flooring subs); 5–10 paying at
  **$99–$299/mo** (way under Dodge). Prove willingness to pay before over-building.
- **Phase 2 — Real SaaS.** GC leaderboard, enrichment, alerts, self-serve dashboard, more
  verticals. Keep compounding history.
- **Phase 3 — Expand.** More TX sources → other states' equivalents → API / sellable/raisable.

## Positioning
Don't sell raw leads — sell **time and relationships**: "Be the sub the architect already knows
before the RFP." The spreadsheet is the feature; the head start is the product.

## Risks / open questions (revisit)
- Public data = low copycat barrier → moat must be enrichment + history + UX + contacts, not the scrape.
- Outreach compliance (CAN-SPAM, contact data handling / PII).
- TDLR site changes → keep the scraper resilient.
- Will subs actually pay? (Phase 1 answers this cheaply.)
- Multi-business pivot: keep the data model source/tenant-agnostic so we're not boxed into Elite.

## Multi-business note
Architect everything city/source/tenant-agnostic from the start (already doing this) so the same
engine can serve other businesses/verticals or be white-labeled later without a rewrite.
