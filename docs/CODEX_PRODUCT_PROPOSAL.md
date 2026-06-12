# Codex Product Proposal: Construction Intelligence That Leads to Action

> Independent proposal after reviewing `PLATFORM.md` and
> `PROPOSAL_EXPLORER.md`. This is a separate recommendation. It does not replace or
> modify either document.

## 1. Recommendation

Build one shared construction-intelligence platform with customer-specific
workspaces, as proposed in `PLATFORM.md`.

My main product recommendation is to keep the first version narrower and more
action-oriented:

```text
Inbox | Projects | Companies | Lists | Research
```

Do not begin with a large dashboard or a separate top-level tab for every entity
type. The first product should help a user:

1. See what is new or changed.
2. Decide whether it matters.
3. Investigate the connected people and companies.
4. Save it to a list or assign a next action.
5. Return when something changes.

The product becomes valuable through daily history and connected relationships, not
through the number of screens.

## 2. Product shape

### Shared core

The shared core contains:

- All source projects
- Daily source checks
- Field-level project changes
- Status history
- Normalized companies and people
- Project-to-company relationships
- Search
- General schedule signals
- Public, evidence-backed enrichment

### Customer workspace

A workspace contains:

- Relevance rules
- Default filters
- Visible columns
- Saved views
- Lists
- Notes
- Assignments
- Follow-up dates
- Alert rules
- Customer-specific qualification fields
- Manual include/exclude decisions

Elite is the first workspace. A second customer should use the same application and
data model with different configuration.

## 3. The central workflow

The main workflow should be:

```text
Daily source check
  -> project is new or changed
      -> workspace lens decides whether it may matter
          -> item appears in Inbox
              -> user reviews project
                  -> dismiss, watch, research, or pursue
                      -> future changes return it to Inbox
```

This is more useful than asking users to repeatedly search a large table for
something new.

## 4. Main navigation

### Inbox

Inbox answers:

> What changed that may require my attention?

It combines:

- New matched projects
- Status changes
- Date changes
- Scope changes
- Projects newly flagged as possibly late
- New GCs or parent companies found
- Watched companies appearing on another project
- Research tasks completed

Each item should explain why it appeared:

```text
EOS Fitness Coit
Reason: New project matched Elite Fitness lens
Reason: 58,854 sqft renovation
Reason: Known repeat operator
Action: Review | Add to list | Assign | Dismiss
```

Inbox is not a permanent project stage. It is a queue of new information. Once
reviewed, the item leaves the Inbox unless another important change occurs.

### Projects

Projects is the complete searchable table.

Recommended shared columns:

| Column | Purpose |
|---|---|
| Changed | New or recently changed |
| Status | Current source status |
| Project | Project/facility name |
| Location | City and address |
| Work type | New, alteration, addition, etc. |
| Scope | Source description |
| Square feet | Corrected size |
| Estimated cost | Source estimate |
| Start | Estimated start |
| Completion | Estimated completion |
| Schedule | Upcoming, active, possibly late, complete, unknown |
| Owner | Clickable |
| Tenant | Clickable |
| Architect | Clickable |
| Filer | Clickable |
| GC | Clickable or visibly unknown |
| Last checked | Source freshness |

Elite workspace columns:

- Operator/brand
- Franchisee
- Build pattern
- Flooring fit
- Equipment fit
- Combined-service fit
- Likely hiring route
- Assigned user
- Next action
- Sales stage
- Lists

Users should be able to show, hide, reorder, resize, and save columns.

### Companies

Companies should have subviews:

```text
All | Operators | Franchisees | Architects | GCs | Owners | Tenants |
Developers | Dealers | Installers
```

This is cleaner than putting eight entity types in the main navigation.

Each company row should show:

- Company name
- Type
- Total projects
- Active projects
- Recent projects
- Connected company types
- Geography
- Contact information
- Workspace tags
- Lists

Clicking any company opens its full profile and relationship history.

### Lists

Lists answer:

> What did we intentionally decide to keep working?

Default lists:

- Watching
- Needs Research
- Outreach This Week
- Active Opportunity
- Existing Client
- Bid Submitted
- Won
- Lost
- Not Relevant

Users can create custom lists:

- CLUB4
- EOS Research
- DFW Conversions
- Architect Introductions
- Missing GC Priority

A list can contain projects, companies, or people.

Each list item can have:

- Assigned user
- Priority
- Next action
- Due date
- Notes

### Saved views are different

A saved view is automatic:

```text
All fitness conversions over 20,000 sqft
```

A list is intentional:

```text
Projects Sol plans to contact this week
```

The product needs both.

### Research

Research turns missing or uncertain information into tasks.

Shared queues:

- Missing GC
- Possible duplicate company
- Possible parent/shell-company group
- Missing contact
- Missing operator/franchisee

Elite queues:

- Unknown flooring buyer
- Unknown equipment buyer
- Unknown dealer
- Unknown installer
- Schedule flag needing field confirmation

Research results require:

- Value found
- Source URL or source description
- Date found
- Researcher
- Confidence
- Notes

## 5. Project Detail page

The project page should have five sections.

### Overview

- Complete source facts
- Current status
- Dates
- Size and cost
- Scope
- Source URL
- Last checked

### Changes

Show a field-level timeline:

```text
June 12: Status changed from Registered to Review Complete
June 18: Completion changed from August 1 to September 15
June 24: Scope changed
```

The user should never have to compare old screenshots manually.

### Connections

Clickable relationships:

- Operator
- Parent company
- Franchisee
- Tenant
- Owner
- Owner group
- Developer
- Architect
- Filer
- GC
- Dealers
- Installers
- Individual contacts

### Workspace

Elite-specific decisions:

- Included, review, or excluded
- Flooring fit
- Equipment fit
- Combined-service fit
- Likely buyer
- Hiring route
- Existing relationship/vendor
- List membership
- Assignment
- Next action
- Follow-up date

### Evidence

Every non-source fact should show:

- What is claimed
- Whether it is confirmed or possible
- Source
- Who added it
- Date added

## 6. Company Profile page

Every company type should use one reusable profile template.

### Identity

- Canonical name
- Source name variants
- Company type
- Addresses
- Phones and contacts
- Parent/subsidiary relationships

### Project history

- All projects
- Active projects
- Recent changes
- New construction/remodel/conversion mix
- Geography
- Typical project size

### Relationship history

| Connected company/person | Role | Projects | Active | First seen | Last seen |
|---|---|---:|---:|---|---|

Examples:

- Operator to architect
- Operator to GC
- Architect to filer
- GC to operator
- Owner to tenant
- Dealer to installer

### Workspace activity

- Lists
- Tags
- Assigned user
- Notes
- Existing relationship
- Next action
- Research tasks

## 7. Model relationships, not single columns

The UI can display a `GC` column, but the database should not assume every project has
exactly one GC.

Use project relationships:

```text
Project A -> Company X -> role: general contractor
Project A -> Company Y -> role: architect
Project A -> Company Z -> role: owner
Project A -> Company Q -> role: operator
```

Each relationship stores:

- Role
- Source
- Confidence
- Start/end dates when relevant
- Whether it is primary

This supports:

- Multiple GCs
- Multiple tenants
- Developer versus owner
- Corporate parent versus franchisee
- Dealers and installers
- Correct history when relationships change

## 8. Daily update engine

Daily history is the first engineering priority.

Recommended process:

1. Run the TABS index scan.
2. Compare index records with current database records.
3. Identify new projects and likely changes.
4. Fetch full details only for new/changed projects.
5. Recheck active non-terminal projects.
6. Store the latest project.
7. Store field-level changes.
8. Recalculate schedule state.
9. Re-evaluate workspace lenses.
10. Generate Inbox items and alerts.

### Store project versions

Current status alone is insufficient. Store either:

- Complete project snapshots when data changes, plus a calculated field diff; or
- An append-only field-change table with before/after values.

My recommendation is:

- Keep the current normalized project row.
- Store a raw snapshot/version whenever its content hash changes.
- Generate field-level `project_changes` from the version comparison.

This preserves evidence while making the UI easy to query.

### Initial schedule

- Index scan once daily
- New and active project details once daily
- Closed projects only when the index indicates a change
- Manual refresh for an individual project

Use GitHub Actions first. Move to an always-on worker only if runtime or reliability
requires it.

## 9. Workspace lens design

Do not build a complicated self-service rule builder first.

For the first two customers:

- Store lens configuration in the database.
- Manage it through a simple internal admin screen or configuration file.
- Observe which rules are actually reused.
- Build the polished customer rule builder later.

This avoids spending weeks building a generic rules engine before proving the product.

### Lens output

Every project has one workspace state:

- Matched
- Review
- Manually included
- Excluded

The lens should also explain why:

```text
Matched because:
- fitness keyword
- renovation
- 42,677 sqft
- private funds

Excluded rule not applied:
- known repeat operator exception
```

Users need to understand why a project appeared.

## 10. Elite workspace

Start with broad matching and let the team tighten it from real use.

### Include

- Commercial gyms
- Fitness centers
- Health clubs
- Athletic training facilities
- Known operators and franchisees
- Flooring replacement
- Equipment installation or relocation

### Exclude by default

- Apartment amenity rooms
- Hotel fitness rooms
- Physical-therapy gyms
- Small office fitness rooms
- School gymnasiums from the private-gym view

Keep school/public athletic projects in a separate saved view.

### Square-footage rule

Use a configurable default minimum, not a permanent exclusion.

Always allow:

- Existing clients
- Known repeat operators
- Manually included projects
- Explicit flooring/equipment scopes

Choose the actual minimum after reviewing the corrected size distribution with
Aaliyah and Sol.

### Initial Elite saved views

- Inbox: New or Changed Fitness Projects
- Active Private Gyms
- Possibly Late
- Completion Due in 30 Days
- Existing-Box Conversions
- Flooring + Equipment Fit
- Missing GC - Active
- CLUB4
- EOS
- Repeat Operators
- Architects with Active Fitness Projects
- Public Athletic Flooring

## 11. Schedule signals

Initial shared states:

- Upcoming
- Expected active
- Possible stalled start
- Possibly late
- Severely late
- Complete
- Unknown

The threshold can vary by workspace.

Always display:

> Source dates are estimates and status may lag the jobsite. This is an attention
> signal, not proof that the project is late.

Workspace users can add:

- Confirmed on time
- Confirmed delayed
- Paused
- Cancelled
- Completed in field
- Revised field date
- Confirmation source

The known delayed CLUB4 project is the first validation case.

## 12. Owner and shell-company handling

Do not automatically merge LLCs.

Preserve:

- Raw owner name
- Canonical company, if confidently resolved
- Possible parent/group
- Evidence
- Confidence

Useful signals:

- Shared mailing address
- Shared phone
- Shared contact
- Address-like LLC name
- Single-project owner
- Same operator and architect
- Public business filing
- Permit or direct confirmation

Possible states:

- Confirmed group
- Possible group
- Not related
- Needs research

The Owner profile should show likely related LLCs, but a user or verified source
should confirm the group before it becomes a shared fact.

## 13. Shared enrichment versus private research

Not every customer-entered note should become global platform data.

Use this promotion flow:

```text
Workspace research result
  -> private by default
      -> verified against public evidence
          -> promoted to shared enrichment
```

Examples:

- Public permit identifying a GC can become shared after verification.
- "Aaliyah says this buyer is difficult" remains private.
- A private vendor relationship remains private unless the customer chooses otherwise.

This protects customer knowledge and keeps shared data trustworthy.

## 14. What not to build in version 1

Do not build:

- A complex relationship graph visualization
- Automated lead scores
- A polished no-code lens builder
- Billing
- Many notification channels
- Nationwide sources
- Full CRM automation
- Automatic shell-company merging
- AI-generated conclusions presented as facts

Tables, profiles, change history, lists, and evidence will produce more value first.

## 15. Recommended build phases

### Phase 0: Data reliability

Deliverables:

- Verified backfill
- Correct numeric fields
- Daily index scan
- Project versions
- Field-level change history
- Reliable status history

Exit test:

> Can we prove exactly what changed on a project and when we observed it?

### Phase 1: Read and investigate

Deliverables:

- Elite workspace configuration
- Inbox
- Projects table
- Project Detail
- Companies with type subviews
- Company Profile
- People search/profile
- Global search
- Saved views
- Schedule signals

Exit test:

> Can Aaliyah or Sol find an interesting change, click through every connected
> company/person, and understand the available evidence?

### Phase 2: Act and remember

Deliverables:

- Lists
- Assignments
- Notes
- Follow-up dates
- Manual include/exclude
- Field schedule confirmation
- Daily email digest

Exit test:

> Can the team turn a project into a repeatable next action and return to it later?

### Phase 3: Research and enrich

Deliverables:

- Research queues
- Evidence records
- Manual GC entry
- Company aliases
- Owner/shell-company groups
- Operator/franchisee normalization
- Shared-enrichment promotion workflow

Exit test:

> Does one researched fact automatically improve every related project and company
> profile without becoming an unsupported claim?

### Phase 4: Prove reuse

Deliverables:

- Second customer workspace
- Different lens and custom columns
- Workspace privacy
- Workspace-specific alert configuration

Exit test:

> Can a second company use the same product without Elite-specific code?

### Phase 5: Automate selectively

Possible work:

- Permit API matching
- Contact enrichment
- Dealer/installer research
- Additional sources
- Additional states
- More notification channels
- Customer-managed lens builder

Only automate workflows that have already proven useful manually.

## 16. First product demonstration

The first coherent demonstration should show:

1. **Inbox:** projects that were new or changed today.
2. **Project:** the known delayed CLUB4 site and its schedule signal.
3. **Connections:** click from an EOS project to the EOS operator profile.
4. **History:** click the repeated architect and see all related projects.
5. **Action:** add a project to `Outreach This Week`.
6. **Research:** open a blank GC task and add permit evidence.
7. **Propagation:** show the GC on the project, company profile, and relationship table.

That demonstration proves freshness, investigation, action, and compounding data.

## 17. Suggested record model

Shared records:

```text
projects
project_versions
project_changes

companies
company_aliases
company_relationships

people
person_aliases
person_company_roles

project_company_roles
project_person_roles

evidence
shared_enrichment
```

Workspace records:

```text
workspaces
workspace_lenses
workspace_saved_views
workspace_alert_rules

workspace_project_state
workspace_company_state
workspace_person_state

lists
list_items
research_tasks
workspace_notes
```

## 18. Product success criteria

The product is successful when:

1. Daily changes arrive without manual scraping.
2. A user can explain why a project matched.
3. Every important name is clickable.
4. Company history builds automatically from project relationships.
5. Unknown fields are visibly unknown.
6. Enriched facts include evidence.
7. Users can save records into actionable lists.
8. Possible delays return to the user's attention.
9. Elite can use custom rules without creating an Elite-only codebase.
10. A second customer can use the same platform with a different lens.

## 19. Final recommendation

Adopt Claude's core/workspace architecture.

My product changes are:

1. Make **Inbox** the first screen and center the product on new information.
2. Keep **Companies** as one main area with entity-type subviews.
3. Treat **Monitor** as saved project views and alerts, not necessarily a permanent
   top-level product section.
4. Use **Lists** for intentional work and saved views for automatic filters.
5. Model GCs, owners, operators, architects, and vendors as sourced relationships.
6. Build daily versions and field-level changes before a polished UI.
7. Configure the first workspaces internally before building a generic rule builder.
8. Prove reuse with Elite and one second customer before broad SaaS features.

This keeps the product understandable, useful immediately, and technically capable of
growing beyond Elite.
