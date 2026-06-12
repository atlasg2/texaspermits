# Elite — TABS Lead Engine

Scrapes Texas TDLR Architectural Barriers projects (the TABS system) into a database,
tracks each project's status as it moves through its lifecycle, and turns
status changes (e.g. *Project Registered → Review Complete*) into outbound
construction leads for Elite Installation Services.

## Why
TABS lists every commercial construction project in Texas ≥ $50k, with the
**owner, architect (design firm), and RAS — including phone numbers**. The one
thing it lacks is the general contractor, which we bridge later via a
building-permit API. See `docs/PLAN.md` for the full architecture.

## Repo map
| Path | What |
|---|---|
| `docs/PLAN.md` | Architecture, decisions, data findings, the model & resumability answers |
| `docs/PROPOSAL_EXPLORER.md` | Proposed software tabs, pages, workflows, and how all records connect |
| `docs/WORKLOG.md` | Chronological progress log — **updated every prompt** so context is never lost |
| `docs/DATA_MODEL.md` | Every field we extract + the status lifecycle |
| `scrape_poc.py` | Proof-of-concept parser (validated on real records) |
| `scraper/tabs_scraper.py` | **Resumable** backfill scraper → SQLite (`data/tabs.db`) |
| `data/` | Output database + exports (git-ignored) |

## Quick start
```bash
pip install requests beautifulsoup4
# backfill 5 years, 4 parallel connections, fully resumable:
python3 scraper/tabs_scraper.py --years 2021-2025 --workers 4
```
If it stops (Wi-Fi drop, Ctrl-C, laptop sleep), just run the same command
again — it skips everything already fetched and continues.

## Status
See `docs/WORKLOG.md` for the latest. Currently: recon done, parser validated,
resumable scraper built, backfill ready to run.
