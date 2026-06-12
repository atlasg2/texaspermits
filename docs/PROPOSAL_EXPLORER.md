# Proposal: Elite Fitness Project Intelligence Software

> Proposal only. This document explains what to build, what each page does, and how
> the pages connect. It does not assume that TABS contains facts it does not contain.

## 1. Simple definition

Build one internal web application that helps Elite answer:

1. What fitness projects are active?
2. Which projects may be behind schedule?
3. Who is connected to each project?
4. How has each architect, GC, operator, franchisee, or contact worked in the past?
5. Who can hire Elite for flooring, equipment installation, or both?
6. What information is still missing, and what should be researched next?

The project is the center of the software. Accounts, people, companies, schedule
alerts, and research records all connect back to projects.

This is not just a lead list. It is a searchable project and relationship history.

## 2. Main navigation

The application should have five primary tabs:

| Tab | Purpose |
|---|---|
| **Projects** | Search and filter every fitness project |
| **Monitor** | Watch active projects and flag possible schedule problems |
| **Accounts** | Understand how each operator or franchisee builds and buys |
| **Directory** | Search every architect, GC, tenant, owner, filer, and contact |
| **Research** | Fill missing GCs and other facts, with evidence |

Every page connects to the others. The user should never have to run a separate
spreadsheet search to understand a name.

### Example click path

```text
Projects
  -> click EOS Fitness
      -> EOS account page
          -> click James E. Stroh
              -> architect profile
                  -> click EOS Little Elm
                      -> project detail
                          -> click missing GC
                              -> GC research task
```

Links can open in the same browser tab by default. Normal browser behavior should
allow Ctrl/Cmd-click or "Open in new tab" when the user wants to compare records.

## 3. Tab One: Projects

This is the main working table.

### Default table columns

| Column | Meaning |
|---|---|
| Schedule health | Upcoming, active, possibly late, severely late, complete, unknown |
| TABS stage | Project Registered, Review Complete, Inspection Complete, Closed, etc. |
| Brand/account | Normalized operator or franchisee when known |
| Project | Project or facility name |
| City | Project location |
| Work type | New construction, existing-box conversion, remodel, addition |
| Square feet | Corrected project size |
| Start | Estimated start date from TABS |
| Completion | Estimated completion date from TABS |
| Architect | Clickable company/person |
| General contractor | Clickable when known; visibly blank when unknown |
| Tenant/operator | Clickable |
| Owner/landlord | Clickable |
| Filer | Clickable |
| Service fit | Flooring, equipment, both, unclear |
| Next action | Research, call, monitor, bid, dismiss |

The user can choose which columns are visible and save table views.

### Filters

- Active only
- Possibly late
- Completion date passed
- New this week
- Status changed recently
- Brand/account
- Corporate operator or franchisee
- New construction
- Existing retail-box conversion
- Remodel
- Square-footage range
- Architect
- General contractor
- Missing general contractor
- Tenant
- Owner
- Filer
- City, county, or metro
- Flooring opportunity
- Equipment opportunity
- Combined opportunity

### Search

One search box should search:

- Project number
- Project and facility names
- Address
- Brand/account
- Tenant
- Owner
- Architect
- GC
- Filer
- Contact name
- Phone number
- Scope of work

### Click behavior

- Click the **project name** -> Project Detail page.
- Click the **brand/account** -> Account page.
- Click the **architect, GC, tenant, owner, or filer** -> Directory profile.
- Click a blank **GC** cell -> Add GC / Create Research Task.
- Click the **schedule flag** -> Project Detail page opened at Schedule.

## 4. Project Detail page

This page contains everything known about one project.

### A. Project facts

- TABS project number
- Project and facility names
- Full address
- Registration date
- Estimated start date
- Estimated completion date
- Estimated cost
- Corrected square footage
- Type of work
- Scope of work
- Current TABS status
- Status-change history collected by this system
- Link to the source record

### B. Build type

Each project should be classified as:

- New construction
- Existing-box conversion
- Remodel/refresh
- Addition
- Unknown

This matters because gyms cannot be mapped only through developers.

For example, CLUB4 often leases an existing large retail box and renovates it. The
landlord may be different on every project and may have little to do with selecting
Elite. For a ground-up project, the developer or landlord may matter much more.

The classification must show its evidence:

```text
Build type: Existing-box conversion
Evidence: TABS type = Renovation/Alteration
Scope: "Interior renovation of existing retail space..."
```

### C. Connected people and companies

Show clickable cards for:

- Brand/operator
- Corporate parent
- Franchisee
- Tenant
- Owner/landlord
- Developer, if relevant
- Architect
- Filer
- General contractor
- Equipment manufacturer/dealer
- Flooring manufacturer/dealer
- Existing flooring installer
- Existing equipment installer
- Known construction/procurement contact

TABS supplies only some of these. Missing fields remain blank until researched.

### D. Route to Elite

This section answers how Elite could get hired.

| Question | Example answer |
|---|---|
| Flooring controlled by | Operator / GC / flooring dealer / unknown |
| Equipment install controlled by | Operator / equipment dealer / GC / unknown |
| One party can award both | Yes / no / unknown |
| Most likely buyer | Named company or role |
| Best introduction route | Direct / architect / GC / dealer / existing relationship |
| Existing installer | Confirmed name / unknown |
| Evidence | Source links and notes |
| Next action | Exact research or outreach task |

Do not use a vague "winnable" score. Show the actual facts and missing facts.

### E. Notes and activity

- Calls and conversations
- Field observations
- Bid history
- Who at Elite owns the follow-up
- Next follow-up date
- Attachments or source links
- Confirmed facts versus hypotheses

## 5. Tab Two: Monitor

This tab watches active projects and estimates which ones need attention.

### Monitor table

| Column | Meaning |
|---|---|
| Health | Upcoming, active, possibly late, severely late, complete, unknown |
| Project | Clickable project |
| Account | Clickable operator/franchisee |
| Estimated start | TABS date |
| Estimated completion | TABS date |
| Days past completion | Calculated from today's date |
| Current status | Latest TABS status |
| Last status change | Date this system observed a change |
| Field confirmation | On time, late, paused, complete, unknown |
| Delay reason | Optional researched note |
| Next check | Follow-up date |

### Initial schedule rules

These are attention flags, not claims of fact:

- **Upcoming:** estimated start date is in the future.
- **Expected active:** today is between estimated start and completion.
- **Possible stalled start:** start date passed, but the project still appears to be
  in an early status after a chosen grace period.
- **Possibly late:** completion date passed, but status is not Inspection Complete
  or Project Closed.
- **Severely late:** completion date passed by more than 90 days and the project is
  not complete.
- **Complete:** status indicates inspection complete or closed.
- **Unknown:** dates or status are insufficient.

Always display this warning:

> TABS dates are estimates and TABS status can lag the jobsite. This flag means
> "check this project," not "this project is definitely late."

### Field confirmation

Elite can replace uncertainty with direct knowledge:

```text
System estimate: Possibly late
Field confirmation: Confirmed late
Confirmed by: Aaliyah
Confirmed on: [date]
Note: CEO onsite; opening schedule under pressure
```

The known delayed CLUB4 project should be the first validation case. If the system
flags a project Elite already knows is badly behind, the partners can see why the
monitor is useful. Late finish-out projects may also be especially relevant to
Elite's combined flooring and equipment-installation offer.

### Alerts

The system can later send:

- Project entered its expected active window
- Completion date is approaching
- Project became possibly late
- Project became severely late
- TABS status changed
- New field note was added

## 6. Tab Three: Accounts

An account is the party whose repeat work could produce multiple Elite projects.

An account may be:

- Corporate gym operator, such as EOS
- Multi-unit franchisee, such as a specific Crunch franchise group
- Regional chain
- Smaller operator with repeat openings
- Equipment dealer or manufacturer
- Flooring dealer or manufacturer
- GC with repeat fitness work

Do not assume that one brand equals one buyer. Crunch and Planet Fitness may need to
be separated into franchisee accounts. Do not assume the landlord is the account
just because the landlord appears as owner in TABS.

### Accounts table

| Column | Meaning |
|---|---|
| Account | Operator, franchisee, dealer, or other repeat buyer |
| Account type | Corporate, franchisee, regional operator, dealer, GC |
| Total projects | All matched projects |
| Active projects | Current pipeline |
| Possible late projects | Monitor count |
| Build pattern | Ground-up, conversions, remodels, mixed |
| Main architect | Most repeated architect |
| Main GC | Most repeated GC, if known |
| Purchasing status | Centralized, local, mixed, unknown |
| Combined award possible | Yes, no, unknown |
| Primary contact | Known decision-maker |
| Next action | Specific task |

### Account Detail page

#### A. Pipeline

- All projects
- Active projects
- Project timeline
- Cities and markets
- New construction versus conversion versus remodel
- Typical square-footage range
- Schedule problems

#### B. Repeated relationships

- Architects used and project counts
- GCs used and project counts
- Filers used and project counts
- Repeated tenant contacts
- Equipment dealers
- Flooring dealers
- Known installers

#### C. How the account appears to buy

Show separate, evidence-based answers:

- Is design centralized?
- Are GCs centralized or selected locally?
- Is flooring selected centrally?
- Is equipment selected centrally?
- Who hires the flooring installer?
- Who hires the equipment installer?
- Can the two packages be awarded together?
- Does an existing vendor appear locked in?
- Who has authority to test Elite on one project?

#### D. Relationship interpretation

The software should explain patterns without pretending they prove procurement:

**Same architect, same filer, many owners**

This usually indicates a centralized operator process and changing landlords. The
owners are probably not the main target. Investigate the operator's construction or
procurement team and the repeating architect.

**Same operator, same architect, different GCs**

The operator likely maintains design standards but selects GCs per project. This
could favor an operator-direct nationwide installation partner, but only if the
operator controls flooring or equipment installation.

**Same operator, same architect, same GC**

There may be one concentrated channel. Research whether the operator or GC awards
Elite's scopes. The repeating GC could be a strong relationship or a barrier.

**Same brand, different franchisees**

These are different accounts until research proves purchasing is centralized.

**Different operators, same architect or GC**

The architect or GC may be a valuable channel relationship across multiple brands.

**Smaller operator, repeat projects, same decision-maker**

This may be a higher-probability opportunity than a huge chain if the decision-maker
can directly award both services.

### EOS example

The currently loaded data shows a strong repeated EOS design pattern:

- Most EOS records resolve to the same architect after name normalization.
- Nearly every EOS record uses the same filer.
- Property owners vary heavily by site.

The software should show this as:

```text
What the data supports:
- Design/filing appears centralized.
- Property owners are mostly site-specific landlords.

What remains unknown:
- Which GCs repeat?
- Who selects flooring?
- Who selects equipment?
- Who hires each installer?
- Can one party award both packages?
```

That makes EOS a high-priority research account, not automatically a high-probability
sale.

## 7. Tab Four: Directory

This is the searchable history of every person and company.

### Entity types

- Architect/design firm
- General contractor
- Operator
- Franchisee
- Tenant
- Owner/landlord
- Developer
- Filer
- Individual contact
- Equipment manufacturer/dealer
- Flooring manufacturer/dealer
- Installer

### Directory search

Search by:

- Person or company name
- Alternate spelling
- Phone
- Address
- Email, when enriched
- Associated brand
- Associated project

Names must be normalized so variants such as:

```text
James E. Stroh, Architect, Inc
James E. Stroh , Architect, Inc
James E. Stroh, Architect, Inc.
```

can resolve to one profile while preserving the original source text.

### Entity Profile page

Every profile should show:

- Canonical name
- Original name variants
- Entity type
- Contact information
- All related projects
- Active projects
- Brands/accounts served
- Cities and regions
- Other entities repeatedly connected to it
- Relationship counts
- Notes and source evidence

#### Architect example

Clicking James E. Stroh should show:

- Every project attributed to the firm
- How many are EOS
- Active EOS projects
- Repeated filer
- GCs found on those projects
- Other brands served
- Phone and address
- Notes about influence over flooring specifications, if verified

#### GC example

Clicking a GC should show:

- Every known project
- Operators and franchisees served
- Architects used
- New construction versus conversion work
- Geographic coverage
- Whether the GC controlled flooring or equipment on any confirmed project
- Elite relationship, bids, wins, and losses

## 8. Tab Five: Research

This page turns blanks into an organized work queue.

### Research queues

- Missing GC
- Missing operator/franchisee identity
- Missing corporate parent
- Missing decision-maker
- Unknown flooring award authority
- Unknown equipment award authority
- Unknown equipment dealer
- Unknown flooring dealer
- Unknown existing installer
- Schedule flag requiring field confirmation
- Duplicate entity requiring normalization

### Missing GC workflow

Most project rows can initially contain a blank GC field because TABS does not
provide the GC.

The user clicks `Find GC` and sees:

- Project address
- City and permit jurisdiction
- Project dates
- Architect
- Tenant/operator
- Suggested permit-search links
- Space for GC name, contact, permit number, source URL, and notes

Save:

- GC company
- GC contact, if available
- Permit number
- Permit jurisdiction
- Source URL
- Date researched
- Researcher
- Confidence: confirmed or possible

A confirmed GC automatically appears:

1. In the project's GC column.
2. On the Project Detail page.
3. On the GC's Directory profile.
4. On the operator's Account page.
5. In relationship counts such as "GC X has built 6 EOS projects."

### Research priority

Do not fill every historical blank first. Work in this order:

1. Active projects that fit both Elite services.
2. Projects with completion dates approaching or passed.
3. Repeat operators and franchisees.
4. Projects tied to high-volume architects.
5. Remaining historical projects.

## 9. How the records connect

The core data structure should work like this:

```text
ACCOUNT
  EOS Fitness
    |
    | has many
    v
PROJECT
  EOS Little Elm
    |
    | connects to
    +--> ARCHITECT: James E. Stroh
    +--> FILER: George Patterson
    +--> GC: blank until researched
    +--> TENANT/OPERATOR: EOS
    +--> OWNER: site landlord
    +--> SCHEDULE MONITOR record
    +--> RESEARCH tasks
    +--> ELITE notes/actions
```

The same entity can connect to many projects. This is what creates history:

```text
James E. Stroh
  -> EOS Little Elm
  -> EOS Coit
  -> EOS Duncanville
  -> ...
```

When the user clicks any connected name, the software queries all projects linked to
the normalized entity and builds its history automatically.

## 10. Data layers

Keep four kinds of information separate:

### A. Source facts

Directly scraped from TABS:

- Project details
- Dates
- Status
- Scope
- Square footage
- Tenant
- Owner
- Architect
- Filer

### B. Enriched facts

Added from another source:

- GC from a building permit
- Franchisee from company research
- Dealer from a press release, bid document, or direct confirmation
- Contact information from a verified source

Every enriched fact must store its source.

### C. Derived signals

Calculated by the software:

- Days past completion
- Possible schedule delay
- Project count per architect
- Repeated GC/operator relationship
- Build-pattern summary

Derived signals must explain their calculation.

### D. Elite knowledge

Entered by Aaliyah, Sol, or another user:

- Relationship notes
- Field-confirmed delay
- Existing vendor
- Who issued the purchase order
- Who selected Elite
- Bid result
- Next action

These layers should never overwrite each other.

## 11. Saved views for Aaliyah and Sol

Useful default views:

- **Active Fitness Projects**
- **Possibly Late Projects**
- **Completion Due in 30 Days**
- **New Projects This Week**
- **Status Changed This Week**
- **Missing GC - Active Projects**
- **Existing-Box Conversions**
- **Flooring + Equipment Opportunities**
- **CLUB4 Pipeline**
- **EOS Pipeline**
- **Repeat Architects**
- **Repeat GCs**
- **Smaller Operators with Multiple Projects**

## 12. What to build first

### Version 1: usable research tool

1. Projects table with filters and global search.
2. Project Detail page.
3. Clickable architect, tenant, owner, filer, and contact profiles.
4. Blank GC field with manual evidence-backed entry.
5. Monitor tab with initial schedule flags.
6. Notes, field confirmation, next action, and assigned person.

### Version 2: account intelligence

1. Brand/operator/franchisee normalization.
2. Accounts table and Account Detail pages.
3. GC Directory profiles.
4. Relationship counts.
5. Research queues.
6. Saved views and alerts.

### Version 3: automation

1. Automated or assisted permit matching for GCs.
2. Daily TABS status monitoring.
3. Email/text alerts for schedule and status changes.
4. Contact enrichment.
5. Equipment dealer, flooring dealer, and installer tracking.
6. Relationship visualization.

## 13. Success test

The software is useful when Aaliyah or Sol can open a project and answer:

1. What is happening?
2. Is it active or possibly behind?
3. Who is connected to it?
4. What else have those people and companies worked on?
5. Who can actually hire Elite?
6. Can one party award flooring and equipment installation together?
7. What fact is missing?
8. What should we do next?

If a page only shows data but does not help answer those questions, it is not
finished.
