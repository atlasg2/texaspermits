#!/usr/bin/env bash
# Daily TABS monitor — the full new-filings + status-change + sync chain.
# Runs from GitHub Actions on a schedule (see .github/workflows/daily-scrape.yml)
# and is equally runnable by hand. Idempotent and safe to re-run.
#
# What it does, in order:
#   1. Compute the current Texas state fiscal year (FY runs Sep 1 -> Aug 31, so
#      after September the FY is calendar year + 1). TABS numbers are TABS{FY}{SEQ}.
#   2. Seed a local worklist from Supabase IF there's no local tabs.db (e.g. on a
#      fresh CI runner). Locally, where a full tabs.db already exists, this is
#      skipped — the real DB is the worklist.
#   3. Scrape: --years <FY> picks up NEW filings; --refresh open re-fetches every
#      non-'Project Closed' project so STATUS CHANGES are detected.
#   4. Sync only rows touched THIS run (--since) into Supabase, logging status
#      events. The site (Vercel) reads Supabase, so it updates automatically.
#
# Usage:
#   set -a; source .env; set +a      # provides DATABASE_URL
#   ./scripts/daily_scrape.sh                 # current FY, refresh open
#   WORKERS=4 ./scripts/daily_scrape.sh       # gentler rate
set -euo pipefail
cd "$(dirname "$0")/.."

# DATABASE_URL may already be exported (CI). Fall back to .env for local runs.
if [ -z "${DATABASE_URL:-}" ] && [ -f .env ]; then
  set -a; source .env; set +a
fi
: "${DATABASE_URL:?DATABASE_URL not set (export it or put it in .env)}"

WORKERS="${WORKERS:-8}"

# Current Texas state fiscal year (Sep 1 rollover). Override with FY=2027 if needed.
if [ -z "${FY:-}" ]; then
  Y=$(date -u +%Y); M=$(date -u +%m)
  FY=$Y
  [ "$((10#$M))" -ge 9 ] && FY=$((Y + 1))
fi

# Timestamp captured BEFORE scraping; matches scraper iso() (UTC, seconds). Only
# rows the scrape actually touches (last_seen_at >= this) get synced.
RUN_START=$(python3 -c "from datetime import datetime,timezone; print(datetime.now(timezone.utc).isoformat(timespec='seconds'))")

echo "=== daily TABS monitor $(date -u) | FY=$FY | workers=$WORKERS | since=$RUN_START ==="

if [ ! -f data/tabs.db ]; then
  echo "--- no local tabs.db; seeding worklist from Supabase ---"
  python3 scripts/seed_sqlite_from_supabase.py
fi

echo "--- scrape: new filings (FY$FY) + refresh open ---"
python3 scraper/tabs_scraper.py --years "$FY" --refresh open --workers "$WORKERS"

echo "--- sync rows touched this run -> Supabase ---"
python3 scripts/sync_to_supabase.py --since "$RUN_START"

echo "=== daily TABS monitor done $(date -u) ==="
