# CLAUDE.md — TABS Lead Engine: how we work

> Project conventions + working agreement. This is the source of truth for *process*.
> Architecture lives in `docs/PLAN.md`; progress in `docs/WORKLOG.md`.

## What this is
A lead engine built on **Texas TDLR TABS** (Architectural Barriers projects). It scrapes
every TABS project, tracks each one's **status through its lifecycle**, and turns status
changes into outbound leads (owner / architect / — later — general contractor).

First use case is a commercial **flooring / fitness / retail install** company, but the core
is **vertical- and tenant-agnostic**: a new vertical or customer is a *config layer* (a
keyword "lens") on top of the same data — **never a code fork or a new database**. Don't
hardcode any one company or vertical into the core.

## Current state (clean rebuild)
We reset to the hard-won core and are rebuilding cleanly. The previous version (Next.js UI,
15-table schema, company/lens/inbox/list scaffolding) is archived on branch **`v1-backup`**.

- **DB:** Neon Postgres (was Supabase). Two tables only: `projects` + `status_history`.
- **No web UI yet** — rebuilding it later, on top of the clean schema, one layer at a time.
- **Layered roadmap:** core (scrape + daily engine) → gym/vertical lens → UI. See `docs/PLAN.md`.

## Working agreement — do these EVERY turn, unprompted
1. **Worklog.** Append a dated entry to `docs/WORKLOG.md` (newest at top): what was asked,
   what changed, what's next. Never let context get lost.
2. **Commit + push after each meaningful unit of work.** Small, frequent commits.
   - Conventional style: `feat:`, `fix:`, `chore:`, `docs:`, `db:`.
   - End every commit message with: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
   - Push to `origin` (`atlasg2/texaspermits`, branch `main`) — the user wants to *see* commits.
   - Never end a task with uncommitted work.
3. **Database changes go through migrations — never ad-hoc.**
   - New schema/SQL ⇒ new file `db/migrations/NNNN_name.sql` (idempotent, forward-only).
   - Apply with `set -a; source .env; set +a; python3 scripts/migrate.py` (tracked in `schema_migrations`).
   - Never hand-edit schema in a dashboard; never run schema SQL that isn't a migration file.
4. **Secrets & PII never touch git.** `.env` only (gitignored). No data, no contact info, no
   keys in commits. The `data/` dir (SQLite + exports) is always gitignored.
5. **No fabricated data.** Emit only what the source actually contains. Unknown field ⇒ leave
   blank; never guess or infer (e.g. never invent a GC for a project). Label any inferred field.
6. **Be a good scraping citizen.** Polite rate, resumable, retry/backoff, respect ToS.

## Repo map
| Path | What |
|---|---|
| `CLAUDE.md` | this — process/conventions |
| `docs/PLAN.md` | architecture & decisions |
| `docs/WORKLOG.md` | dated progress log (updated every prompt) |
| `scraper/tabs_scraper.py` | resumable TABS backfill → SQLite (`data/tabs.db`) |
| `scripts/tabs_index.py` | cheap index scan (valid project numbers + status codes) |
| `scripts/daily_update.py` | daily engine: index-diff → fetch only new/changed → log status moves |
| `scripts/sync_to_supabase.py` | SQLite → Postgres upsert + status_history (rename pending) |
| `scripts/migrate.py` | migration runner (applies pending, idempotent) |
| `run_backfill.sh` | self-healing backfill wrapper (index → scrape loop → sync) |
| `db/migrations/*.sql` | versioned DB schema |
| `.github/workflows/daily-scrape.yml` | scheduled daily engine (cron) |

## Commands
```bash
set -a; source .env; set +a            # load DATABASE_URL (Neon)

# Migrations
python3 scripts/migrate.py             # apply pending
python3 scripts/migrate.py --status    # applied vs pending

# Backfill (one-time; resumable). Fiscal-year buckets, e.g. 2021-2026.
bash run_backfill.sh 2021-2026 8       # years, workers

# Daily engine (also runs via GitHub Action)
python3 scripts/daily_update.py            # current FY + prior FY
python3 scripts/daily_update.py --dry-run  # report deltas, write nothing
```

## Environment notes
- **Neon** Postgres (project DB `neondb`, Postgres 18). Connect via `DATABASE_URL` in `.env`.
  Reachable over IPv4 from the Codespace (no IPv6 issue Supabase had).
- **GitHub:** `atlasg2/texaspermits`. The daily Action needs repo secret `DATABASE_URL`.
- A few scripts still carry the `sync_to_supabase` name from v1 — pure Postgres, works on Neon;
  rename is a pending cleanup.
