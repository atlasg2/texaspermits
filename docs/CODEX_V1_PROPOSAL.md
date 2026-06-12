# Version 1 Product Proposal

## Summary

Build a focused construction-intelligence application:

```text
Inbox | Projects | Companies | Views | Lists
```

V1 helps the team discover new or changed gym projects, inspect full details and
connected companies, communicate internally, and organize follow-up work.

## 1. Inbox

The Inbox is the daily queue of unreviewed events, not a table of every project.

It contains:

- New matching projects
- Status changes
- Start or completion date changes
- Scope, cost, or square-footage changes
- Company changes
- New schedule-risk flags
- Newly discovered company information

### Inbox columns

| Column | Purpose |
|---|---|
| Project | Clickable project name |
| City | Project city |
| Why It Appeared | New project, status change, date change, etc. |
| Last Change | Most recent important change |
| Sq Ft | Corrected square footage |
| Estimated Cost | Source estimate |
| Completion | Estimated completion |
| Action | Review, dismiss, or add to a list |

### Inbox behavior

- `Review` opens the project and marks the event reviewed.
- `Dismiss` removes only that event from the Inbox.
- Dismissing an event does not hide or exclude the project.
- A later important change returns the project to the Inbox.
- Reviewed events remain searchable through the New/Changed view.

## 2. Projects

Projects is the complete searchable table.

### Project table columns

| Column | Purpose |
|---|---|
| Project | Project or facility name |
| City | City and state |
| Status | Current source status |
| Schedule | Upcoming, active, possibly late, complete, or unknown |
| Type | Renovation, new construction, addition, etc. |
| Sq Ft | Corrected square footage |
| Estimated Cost | Source estimate |
| Scope | Short source description |
| Start | Estimated start |
| Completion | Estimated completion |
| Last Change | Most recent important field change |
| Companies | Owner, tenant, architect, and GC summary |

Do not put filer, source URL, last checked, full address, notes, or evidence in the
main table. Those appear after opening the project.

### Filters

- Status
- Schedule state
- Type of work
- Registration date
- Start and completion dates
- Square-footage range
- Estimated-cost range
- City or county
- Owner
- Tenant
- Architect
- GC
- Missing GC
- Keyword or known fitness brand

### Table controls

- Search
- Sort
- Show or hide columns
- Reorder columns
- Save current filters as a view
- Add selected projects to a list

## 3. Project Detail

Clicking a project opens a full page or side panel with:

```text
Overview | Changes | Connections | Team Notes | Lists
```

### Overview

- Full address
- Status
- Type of work
- Square footage
- Estimated cost
- Full scope
- Start date
- Completion date
- Source link
- Last source check

### Changes

Show field-level history:

```text
June 12: Project first found
June 18: Completion changed from August 1 to September 15
June 20: Status changed from Registered to Review Complete
```

### Connections

- Owner
- Tenant
- Architect
- General contractor
- Filer

Every company or person is clickable.

### GC states

A blank GC must have a clear research state:

```text
Not researched | Researching | Possible | Confirmed | Not found
```

Possible and confirmed GCs must remain visibly different.

### Team Notes

Notes support:

- Plain-text comments
- `@mentions`
- Optional due date
- Optional source link
- Open or resolved state

Example:

```text
Nick: This looks worth watching because it is a large renovation.

@Sol can you check whether the city permit lists a GC?
```

### Lists

Show every list containing the project and allow users to add or remove it.

## 4. Companies

Keep company navigation simple:

```text
All | Owners | Tenants | Architects | GCs
```

Filer can be searchable and clickable without receiving a primary company subtab in
V1.

### Company table columns

| Column | Purpose |
|---|---|
| Company | Canonical company name |
| Type | Owner, tenant, architect, or GC |
| Project Count | Total connected projects |
| Active Projects | Non-terminal connected projects |
| Recent Projects | Most recent project names |
| Cities | Main markets |

Company roles belong to project relationships, not one permanent company type. The
same company may be an owner on one project and a tenant or developer on another.

### Company Detail

```text
Identity
Project History
Connected Companies
Team Notes
Lists
```

Connected companies use a simple table:

| Connected Company | Relationship | Shared Projects |
|---|---|---:|
| EOS Fitness | Tenant on same projects | 4 |
| CLUB4 Fitness | Tenant on same projects | 2 |
| ABC Construction | GC on same projects | 1 |

Do not build a visual relationship graph in V1.

## 5. Views

Views are automatic saved filters. Users do not manually add records to a view.

Start with three:

### New / Changed Gym Projects

```text
Project matches fitness keywords or a known brand
AND project was created or changed recently
```

### Active Gym Projects

```text
Project matches fitness
AND status is not Complete, Closed, Cancelled, or Voided
```

A passed estimated completion date does not remove a project from Active. It should
instead receive a `Possibly Late` schedule label.

### Recently Completed Gym Projects

```text
Project matches fitness
AND source status changed to Complete or Closed within the last 90 days
```

An estimated completion date alone never proves completion.

Square footage should be a filter inside these views rather than separate default
views.

## 6. Lists

Lists are manual. A user intentionally adds or removes a record.

Start with two:

### Watchlist

For projects or companies worth monitoring.

### Follow-Up

For records requiring action.

Each Follow-Up item supports:

- Action
- Assignee
- Due date
- Open or resolved state
- Notes

Users may create custom lists later.

### Views versus Lists

```text
Views = the system finds it
Lists = the team chooses it
```

Example:

```text
All CLUB4 Projects = View
Important CLUB4 Projects = List
```

## 7. Daily Processing

Start with deterministic processing:

1. Scan TABS for new or changed projects.
2. Fetch full details for new or changed records and active projects.
3. Compare current values with the previous stored version.
4. Record field-level before/after changes.
5. Match likely gym projects using keywords and known brands.
6. Calculate schedule health.
7. Create Inbox events.
8. Return watched projects to the Inbox when an important change occurs.

### Initial matching

Use:

- Rules to detect source changes
- Keyword and known-brand rules to identify likely gym projects
- Human review to dismiss, watch, or follow up

### AI

AI is not required for launch.

After the reliable workflow works, AI may write short Inbox summaries using only
stored facts:

```text
New 42,000-sq-ft fitness renovation in Denton.
Estimated completion: September 2026.
GC is currently unknown.
```

The factual reason bullets must remain visible under any AI summary.

## 8. Build Priority

Build in this order:

1. Reliable projects database
2. Daily refresh and project-version history
3. Field-level change detection
4. Fitness keyword and brand matching
5. Inbox generation and review state
6. Projects table and filters
7. Project Detail and change timeline
8. Companies table and profiles
9. Automatic Views
10. Watchlist and Follow-Up
11. Team notes, mentions, assignments, and due dates
12. Optional AI-written Inbox summaries

## 9. V1 Exclusions

Do not build:

- Tags
- Separate Research tab
- Elite-specific lead scores
- Automated lead scoring
- Relationship graph visualization
- Automatic shell-company merging
- Full CRM automation
- Customer-managed rule builder
- Nationwide sources
- AI-generated factual conclusions

## 10. Acceptance Tests

- A new matching project enters the Inbox once.
- A later important change returns a reviewed project to the Inbox.
- Dismissal removes the event but does not hide the project.
- Changes show correct before and after values.
- An overdue non-terminal project remains Active and becomes Possibly Late.
- Estimated completion alone never marks a project complete.
- Every connected company opens its complete project history.
- One company can have different roles on different projects.
- Possible and confirmed GCs remain distinguishable.
- Views update automatically from their filters.
- Lists change only through user action.
- Follow-Up assignments, due dates, notes, and resolution state persist.

## 11. Success Definition

Aaliyah, Sol, or another user can:

1. Open the Inbox and understand what changed.
2. Inspect the complete project and company history.
3. Communicate with the team.
4. Dismiss the event, add the record to the Watchlist, or create a Follow-Up action.
5. See the project return when another important change occurs.

The V1 pitch is:

> Every day, the system checks for new or changed gym projects, puts the important
> ones in an Inbox, explains what changed, lets the team inspect the full project and
> connected companies, and save records to a Watchlist or Follow-Up list.
