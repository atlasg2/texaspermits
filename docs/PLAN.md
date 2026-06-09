# PLAN — TABS Lead Engine

> Living architecture & decisions doc. Update when a decision changes.
> Chronological progress lives in `WORKLOG.md`.

## 1. Goal
Build a lead engine for Elite Installation Services (commercial flooring / fitness /
retail install, DFW-based, nationwide). Source = Texas TDLR Architectural Barriers
projects (TABS). Detect projects early in their lifecycle and reach out to the
owner / architect / (later) general contractor.

## 2. Data source — findings (verified)
- **No bulk/open-data export exists.** TABS data is NOT on data.texas.gov. Scraping is the path.
- TABS is a server-rendered ASP.NET site (no API to reverse-engineer).
- **Project numbers are enumerable:** `TABS{FISCAL_YEAR}{SEQ:06d}` (e.g. `TABS2026000010`).
  So we generate numbers directly — no need to drive the search form or collect numbers manually.
- Best page to fetch = the **print view**: `https://www.tdlr.texas.gov/TABS/Search/Print/{pn}`
  - Verified it contains 100% of the fields the full project page has (diffed them — identical).
- **Volume (measured):** ~22k–27k projects per fiscal year; **~154,000 total for FY2021–FY2026.**
  TABS fiscal years run Sept–Aug (FY2026 started Sept 2025, partial/ongoing).
- **Latency (measured):** ~0.16s/request. Server is fast.

## 3. What we extract (per project) — all verified on real records
Project: name, facility, address, county, start/completion dates, estimated cost,
type of work, type of funds, scope of work, square footage, **current status**.
Owner: name, address, **phone**, contact name.
Architect (Design Firm): name, address, **phone**.
RAS: name, RAS #, address, phone.
Filer + Tenant (when present).
**Missing: General Contractor** — never collected by TABS → bridge via permit API later.

## 4. The status lifecycle (the core trigger)
TABS shows only the *current* status — there is **no history on the page**. Statuses seen so far:
`Project Registered → Review Complete → Inspection Complete → Project Closed`
(more intermediate values to be catalogued in the full run).

**Key implication:** the "registered → approved" timeline can't be scraped after the
fact — we BUILD it by snapshotting daily and logging every change ourselves
(`status_history` table). Every day we don't run is history we can't recover →
start the daily scrape ASAP.

Prime lead window for Elite: **Review Complete** (plans approved, heading to construction).

## 5. Architecture
- **Backfill scraper** (`scraper/tabs_scraper.py`): enumerate numbers → fetch print view →
  parse → store in SQLite. Resumable (see §7).
- **Daily delta** (next): fetch new registrations in current FY + re-check non-terminal
  projects; log status changes to `status_history`. Small/fast (minutes).
- **Storage:** SQLite for the scrape (zero-config, durable, resumable). Migrate/sync to
  **Postgres** for the app.
- **App:** Custom **Next.js + Postgres** (chosen). Grid view → row click → detail drawer +
  status timeline. Saved filters ("New this week", "Status changed in 7d", "Review Complete in DFW > $250k").
- **User CRM state kept separate** from scraped facts (`user_project_state`: is_hidden, is_saved,
  lead_stage, notes) so re-scrapes never clobber decisions. "Delete" = hide, never destroy.
- **GC bridge:** address + architect → building-permit API (e.g. Shovels.ai) → GC.
- **Enrichment:** Apollo for contact emails/direct dials on owner/architect/GC.

## 6. Normalization applied in the scraper
- `ras_ras*` → `ras_number / ras_name / ras_address / ras_phone`.
- `estimated_cost` "$450,000" → also stored as integer `estimated_cost_num`.
- `square_footage` "8,750 ft 2" → also `square_footage_num`.
- `location` split into city / state / zip + county (street kept in `location_full`).
Raw values are preserved alongside parsed ones.

## 7. Resumability (the "what if I lose Wi-Fi" answer)
- Every fetch result is **committed to SQLite immediately** (an `attempts` table marks each
  project number done). The CSV-at-the-end PoC was NOT safe; the real scraper is.
- On restart, it loads the set of already-attempted numbers and **skips them** → continues
  exactly where it stopped. Safe against Wi-Fi drops, Ctrl-C, crashes, laptop sleep.
- Network errors are retried (3x w/ backoff); a number that still fails is simply left
  un-recorded so the next run retries it. Nothing is lost.
- **Tip:** running it inside the GitHub Codespace (cloud) means your local Wi-Fi dropping
  doesn't even pause it — the Codespace keeps running. Use `nohup ... &` or a background run.

## 8. Do I need Claude Opus to run this? (model question)
**No — running the scraper uses no AI model at all.** It's plain Python (requests + BeautifulSoup).
Zero LLM calls, zero token cost, nothing to do with Opus/Sonnet/Haiku. You could unplug
Claude entirely and `python3 scraper/tabs_scraper.py` runs the same.
- Claude is only used **while building/changing the code** (design, parsing edge cases, the app).
- For that building work, a stronger model (Opus) helps on architecture & tricky parsing;
  a cheaper model (Sonnet/Haiku) is fine for routine edits. **It never affects the scraped data.**
- LLM cost would only enter later if we *choose* to use one (e.g. AI to classify scope-of-work
  text or dedupe firms) — optional, not required.

## 9. Timing (measured estimates, Balanced = 4 parallel)
| Years | Balanced (~4 conn) | Fast (~8–10 conn) |
|---|---|---|
| 1 yr | ~20 min | ~9 min |
| 3 yr | ~1 hr | ~28 min |
| 5 yr | ~1.7 hr | ~47 min |
| All 6 | ~1.9 hr | ~55 min |
Backfill is one-time. Daily delta afterwards = minutes.

## 10. Open decisions / next steps
- [ ] Run backfill (how many years: FY2021–2025, or include partial FY2026?).
- [ ] Build daily-delta job + `status_history` logging.
- [ ] Postgres schema + Next.js scaffold.
- [ ] GC permit-API integration (Shovels.ai or alt).
- [ ] Apollo enrichment.
