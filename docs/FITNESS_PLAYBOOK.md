# Fitness Vertical Playbook (v0)

> How to turn TABS data into deals for a fitness-install contractor (Elite first).
> Built as a **lens**: vertical keyword sets + stage + cost + geography over the same
> engine. Swap the keyword set and the same machinery serves any trade or vertical.

## 1. Who actually buys gym buildouts in Texas

Three distinct buyer types, each needing a different sales motion:

**A. Corporate-owned chains in TX expansion mode** (one relationship = every future site)
| Brand | Structure | TX signal in our data | Architect fingerprint |
|---|---|---|---|
| EOS Fitness | corporate (PE-backed) | 2 new $5.6M/$6.4M registrations on 6/5/2026 (Little Elm, Plano) | James E. Stroh |
| CLUB4 Fitness | family-owned corporate | 3 projects (El Paso, Bryan, Plano $3–3.5M) | Dean Brent Barron |
| Amped Fitness | corporate, **new TX entrant** | Spring + Sugar Land (FY2025/26) | TBD |
| Fitness Connection | corporate (PE) | Woodlands reno FY2025 | TBD |
| Club Studio / LA Fitness | Fitness International corporate | Arlington $4M FY2026 | TBD |

**B. Mega-franchisees** — "franchise" brands are really a handful of developers:
- **Crunch** (≈25 projects in partial data, the most active brand): three groups own TX —
  **CR Fitness Holdings** (~100 clubs, 9 new TX sites planned by end of 2026),
  **Undefeated Tribe** (Austin-based, 41→100 clubs by 2028; 2026 TX openings incl. Austin,
  San Antonio, Conroe, Dickinson, New Braunfels), **Fitness Ventures** (system's largest,
  115 units; appears in our data as owner of Crunch Odessa).
- **Planet Fitness** (18 projects): ~90% franchised via large multi-unit groups; identify
  the TX groups from our owner fields once backfill completes.
- Each group is ONE buyer relationship worth dozens of buildouts.

**C. Adjacent/public**: ISDs and cities constantly renovate gymnasiums and rec centers
(school districts dominate repeat-owner counts in the gym keyword set). Different motion
(public bids), big athletic-flooring sqft. Keep as a separate lens, not noise.

**Deprioritize**: small-box franchises (Anytime ~$95k tickets, Orangetheory, F45) —
single-unit owners, small scope, high relationship cost per dollar.

**D. Emerging operators (grow-with strategy).** Group gym projects by tenant/owner/contact
name; exclude mega-brands + schools/cities; keep 2–5-project groups in the 5–80k sqft band.
Partial data already surfaces: "Devon Arnold" (5 projects, 35–58k sqft, 5 metros),
Jessica King (3, Houston/Dallas), Mike Manning (2×40k, Frisco) — these contact names ARE
the construction leads. Velocity alert: 3rd registration in 12 months ⇒ they're scaling ⇒
start the relationship. Win at 5 clubs, ride to 50 (CLUB4 was this in 2015). Cross-state
check each name via Shovels/BuildZoom/LinkedIn. (Also: Life Time = 8 projects — add to
brand dictionary.)

## 2. The plays (what Elite actually does with this)

1. **The Live Board** — every gym project in Registered/Review stages right now, with
   cost, city, architect, owner/tenant contacts. TABS beats press releases by months:
   Crunch Dickinson was registered 9/3/2025, PR'd months later.
2. **Architect channel** — get *specified* by the fingerprint architects (Stroh, Barron,
   JPlus, MJM, Phillips Partnership, pb2). They reuse flooring specs across every site
   for their chain client; one spec win = the whole rollout.
3. **Franchisee development pipelines** — watch CR Fitness / Undefeated Tribe /
   Fitness Ventures registrations land in TABS; call the construction manager while the
   project is in plan review.
4. **Shell-corp piercing** — owner LLCs (e.g. "14SM TT Owner LLC") are SPEs; identity
   lives in tenant_name + the repeat architect. A new Barron registration under an
   anonymous LLC ≈ a CLUB4 before it's announced anywhere.
5. **New-entrant alert** — chains entering TX (Amped) have no incumbent TX flooring
   vendor. First call wins.

## 3. Analyses to run when the FY2023–2026 backfill completes
- **Brand × quarter trend**: registrations per brand per quarter — who is accelerating.
- **Brand → architect → owner mapping table** (the fingerprint dictionary, persisted).
- **Timing model**: median lag registration → start_date → status transitions; tells
  Elite *when* in a project's life the flooring bid happens. Improves as status history accrues.
- **Owner-address clustering**: same mailing address across many LLCs = one developer.
- **Geography**: metro heatmap; match against CLUB4/EOS/Crunch announced expansion areas.
- **$/sqft distribution** per brand → estimate flooring scope from registration data.

## 2b. Qualifying the big 8 — four questions per target
Context: **Elite already does CLUB4's flooring nationwide** — CLUB4 is the reference
client, not a target. For each other org:
1. **How do they buy?** Through the GC's construction contract (⇒ need GC names, permit
   bridge) or owner-direct as FF&E with the equipment (⇒ need their construction lead)?
   Elite's combined flooring + equipment install is an owner-direct pitch: one vendor owns
   the last 3 weeks before opening.
2. **Incumbent risk.** Planet Fitness mandates equipment brands corporately (new builds
   likely locked — target franchisee remodels instead). PE chains (EOS) RFP everything —
   winnable on proof/price, and EOS is the highest-velocity TX builder in our data.
   Founder/family chains buy on relationship — the CLUB4 reference lands hardest there.
   New entrants (Amped) have no TX incumbent — first mover wins.
3. **Velocity + geography from the data** — pitch the pipeline ("you have 4 sites in plan
   review in DFW"), not the vendor list.
4. **Remodel cycle.** Gym floors turn over every 5–8 yrs. `type_of_work=Renovation` on
   existing gyms = a separate re-floor/re-equip lead stream, recurring and less contested.

## 3b. Square footage is the brand signature; cost is noise
Estimated cost is self-reported and unreliable (all three CLUB4s = round $3–3.5M;
Crunch boxes of identical size report $1.2M–$4.9M). Square footage is consistent:
- CLUB4 box: ~56–63k sqft (the 5.3k-sqft Barron project in Austin is NOT a CLUB4 —
  sqft separates an architect's chain work from their other jobs)
- Crunch: ~40–55k · EOS: ~40–59k · small-box (Anytime/OTF/F45): <10k
Lens rule: filter/classify on **sqft bands first**, cost only as a secondary sanity
check. Both need outlier bounds (an "EOS 424,886 sqft" = center-wide figure or typo).

## 3c. Beyond Texas: the structure travels, the source doesn't
TABS is Texas-only. But once a brand's structure is learned here (architect of record,
box sqft band, SPE naming patterns), it becomes a *query* against nationwide permit
aggregators: **Shovels.ai** (permits + contractors from 1,800+ jurisdictions, ~85% of US
population, REST API, from ~$599/mo) or **BuildZoom** (contractor profiles built from
permit history). Search "Dean Brent Barron" or "James E. Stroh" nationwide → every
CLUB4/EOS buildout in any state, even under anonymous LLCs. TX = the lab where we learn
each brand's fingerprint cheaply and early; aggregators = the nationwide amplifier.

## 3d. GC discovery (the missing column)
TABS never names the general contractor — but city building permits do. The bridge:
match a TABS project (address + date window) to its building permit in Shovels/city
records → permit names the GC → Elite bids the GC directly. Sequence matters: TABS fires
months earlier (design/plan review); the GC appears when the building permit is pulled.
So the lead lifecycle is: TABS registration (get specified w/ architect) → TABS status
change (construction imminent) → permit match (bid the named GC). Evaluate Shovels API
trial on ~20 known TABS projects before paying.

## 4. Data-hygiene rules learned (encode in the lens)
- Brand lives in **tenant_name / project_name**, not owner_name (gyms lease; owners are SPEs).
- `%club 4%` collides with Sam's Club store numbers; `gym` collides with school
  gymnasiums — keyword sets must be curated per vertical, with exclude-lists.
- ISD/municipal owners = separate public-sector lens, auto-split by owner type.

## 5. Partner demo (the pitch to Elite)
Lead with the CLUB4 Plano find: *"Your client opened a $3M location into permitting on
April 22. Did you know? Here are 4 more gym projects registered THIS WEEK ($14M combined),
with the architect's name and phone for each."* Then show the weekly digest: new gym
registrations + status changes, auto-delivered. That digest IS the product — for Elite
first, for any niche contractor later.

## 6. Working rule: test every theory across multiple cases
No pattern is "real" from one example. The sqft-over-cost rule was confirmed across
CLUB4 + Crunch + EOS; the architect-fingerprint rule across 3 CLUB4 sites + Stroh/EOS +
JPlus/Crunch. Every new theory (a fingerprint, a shell pattern, a timing rule) must be
validated against at least 3 independent brands/projects — and its counterexamples
recorded here — before it drives outreach or product behavior.
