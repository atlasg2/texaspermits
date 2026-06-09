#!/usr/bin/env bash
# Periodic SQLite -> Supabase sync while a backfill is running.
# The sync is an idempotent UPSERT (keyed on project_number), so running it
# repeatedly is safe and keeps Supabase current as the scraper makes progress.
# This means a crash mid-backfill never loses what already reached Supabase.
#
#   ./scripts/sync_watcher.sh 2025-2026        # sync these years every 5 min
#   ./scripts/sync_watcher.sh 2025-2026 180    # custom interval (seconds)
set -uo pipefail
cd "$(dirname "$0")/.."
set -a; source ./.env 2>/dev/null; set +a

YEARS="${1:-2025-2026}"
INTERVAL="${2:-300}"
LOG="data/sync_watcher.log"
mkdir -p data
echo "=== sync watcher start $(date) | years=$YEARS every ${INTERVAL}s ===" | tee -a "$LOG"

while true; do
  echo "--- sync pass $(date) ---" | tee -a "$LOG"
  python3 scripts/sync_to_supabase.py --years "$YEARS" 2>&1 | tee -a "$LOG" || \
    echo "sync pass failed (will retry next interval)" | tee -a "$LOG"
  # Stop only once run_backfill.sh has fully finished (it writes ALL DONE after
  # its own final sync). Tying to the log marker — not process presence — keeps
  # us syncing across scraper crash/relaunch gaps.
  if grep -q "ALL DONE" data/backfill.log 2>/dev/null; then
    echo "=== backfill ALL DONE; final watcher sync complete $(date) ===" | tee -a "$LOG"
    break
  fi
  sleep "$INTERVAL"
done
