# DATA MODEL

## Source field → stored column
Fetched from `https://www.tdlr.texas.gov/TABS/Search/Print/{project_number}`.

| Stored column | Source label | Notes |
|---|---|---|
| project_number | Project Number | PK, `TABS{FY}{SEQ:06d}` |
| registration_date | Registration Date | header |
| project_name | Project Name | |
| facility_name | Facility Name | |
| location_full | Location Address | street + city/state/zip joined |
| location_city / location_state / location_zip | (parsed from address tail) | |
| location_county | Location County | |
| start_date | Start Date | |
| completion_date | Completion Date | |
| estimated_cost_raw / estimated_cost_num | Estimated Cost | "$450,000" + 450000 |
| type_of_work | Type of Work | New Construction / Additions / Renovation-Alteration / ... |
| type_of_funds | Type of Funds | private vs public/federal |
| scope_of_work | Scope of Work | free text — useful for trade qualification |
| square_footage_raw / square_footage_num | Square Footage | "8,750 ft 2" + 8750 |
| tenant_private_funds | Are the private funds provided by the tenant? | Yes/No |
| current_status | Current Status | drives lead lifecycle |
| filer_contact_name | Person Filing Form › Contact Name | |
| ras_name / ras_number / ras_address / ras_phone | RAS section | |
| owner_name / owner_address / owner_phone / owner_contact_name | Owner section | |
| tenant_name / tenant_phone | Tenant section | often absent |
| design_firm_name / design_firm_address / design_firm_phone | Design Firm (architect/engineer) | |
| raw_hash | — | sha256 of page; change detection |
| first_seen_at / last_seen_at / last_changed_at | — | bookkeeping |

**Not available in TABS:** General Contractor (bridge via permit API later).

## Status lifecycle (observed; to be completed during full run)
`Project Registered` → `Review Complete` → `Inspection Complete` → `Project Closed`
- Terminal: `Project Closed` (and likely `Voided`/`Withdrawn` — confirm in full run).
- Prime outreach window: **Review Complete**.

## Tables (SQLite, scraper)
- `projects` — one row per project (latest parsed state + bookkeeping columns above).
- `attempts(project_number, status, fetched_at)` — every number tried (`valid`/`empty`); powers resume.
- `status_history(id, project_number, old_status, new_status, changed_at)` — append-only;
  the timeline we build ourselves (TABS doesn't store it).
