# CLAUDE.md — Elite Lead Engine: how we work

> Project conventions + working agreement. This is the source of truth for *process*.
> Architecture lives in `docs/PLAN.md`; progress in `docs/WORKLOG.md`.

## What this is
A lead engine for **Elite Installation Services** (commercial flooring / fitness / retail
install). It scrapes Texas TDLR **TABS** (Architectural Barriers projects), tracks each
project's status through its lifecycle, and turns status changes into outbound leads
(owner / architect / — later — general contractor). May later generalize to more
businesses, so **keep the design source- and tenant-agnostic; don't hardcode "Elite."**

## Working agreement — do these EVERY turn, unprompted
1. **Worklog.** Append a dated entry to `docs/WORKLOG.md` (newest at top): what was asked,
   what changed, what's next. Never let context get lost.
2. **Commit + push after each meaningful unit of work.** Small, frequent commits.
   - Conventional style: `feat:`, `fix:`, `chore:`, `docs:`, `db:`.
   - End every commit message with: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
   - Push to `origin` (`nicksanford1/elite`, branch `main`) — the user wants to *see* commits.
   - Never end a task with uncommitted work.
3. **Database changes go through migrations — never ad-hoc.**
   - New schema/SQL ⇒ new file `supabase/migrations/NNNN_name.sql` (idempotent, forward-only).
   - Apply with `set -a; source .env; set +a; python3 scripts/migrate.py` (tracked in `schema_migrations`).
   - Never hand-edit schema in the Supabase dashboard; never run schema SQL that isn't captured as a migration file.
4. **Secrets & PII never touch git.** `.env` / `.env.local` only (gitignored). No data, no
   contact info, no keys in commits. Service-role key is server-side only. The
   `data/` dir (SQLite + exports) is always gitignored.
5. **No fabricated data.** Emit only what the source actually contains. Unknown field ⇒ leave
   blank; never guess or infer (e.g. never invent a GC for a project). Label any inferred field.
6. **Be a good scraping citizen.** Polite rate, resumable, retry/backoff, respect ToS.

## Repo map
| Path | What |
|---|---|
| `CLAUDE.md` | this — process/conventions |
| `docs/PLAN.md` | architecture & decisions |
| `docs/WORKLOG.md` | dated progress log (updated every prompt) |
| `docs/DATA_MODEL.md` | scraped fields + status lifecycle |
| `scraper/tabs_scraper.py` | resumable TABS backfill → SQLite (`data/tabs.db`) |
| `supabase/migrations/*.sql` | versioned DB schema |
| `scripts/migrate.py` | migration runner (applies pending, idempotent) |
| `scrape_poc.py` | original proof-of-concept parser |

## Commands
```bash
# DB migrations (Supabase, via IPv4 pooler in .env)
set -a; source .env; set +a
python3 scripts/migrate.py            # apply pending
python3 scripts/migrate.py --status   # show applied vs pending

# Scrape (resumable; newest filings first). One year at a time is fine.
python3 scraper/tabs_scraper.py --years 2026 --workers 8
python3 scraper/tabs_scraper.py --years 2025 --workers 8   # next year, no restart
```

## Environment notes
- Supabase project: `fuerkvotxxiaiyfqevny`. Connect via the **IPv4 Session Pooler**
  (`aws-1-...pooler.supabase.com`); the direct `db.*` host is IPv6-only and unreachable here.
- GitHub: `nicksanford1/elite`. The Codespace token can push but **cannot create repos**.
