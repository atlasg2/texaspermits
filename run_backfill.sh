#!/usr/bin/env bash
# Self-healing TABS backfill + Supabase sync for one or more fiscal years.
# Resumable: if the scraper dies (Wi-Fi/crash), the loop re-runs it and it
# continues from where it stopped. Syncs to Supabase when scraping completes.
#
#   ./run_backfill.sh 2026
#   ./run_backfill.sh 2021-2026
set -uo pipefail
cd "$(dirname "$0")"
set -a; source ./.env 2>/dev/null; set +a

YEARS="${1:-2026}"
WORKERS="${2:-8}"
LOG="data/backfill.log"
mkdir -p data
echo "=== backfill start $(date) | years=$YEARS workers=$WORKERS ===" | tee -a "$LOG"

for i in $(seq 1 100); do
  python3 scraper/tabs_scraper.py --years "$YEARS" --order newest --workers "$WORKERS" 2>&1 | tee -a "$LOG"
  if tail -n 3 "$LOG" | grep -q "Nothing to do"; then
    break
  fi
  echo "--- loop $i finished a pass; re-checking for remaining/retry work ---" | tee -a "$LOG"
  sleep 10
done

echo "=== scrape complete, syncing to Supabase $(date) ===" | tee -a "$LOG"
python3 scripts/sync_to_supabase.py --years "$YEARS" 2>&1 | tee -a "$LOG"
echo "=== ALL DONE $(date) ===" | tee -a "$LOG"
