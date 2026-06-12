# Issue: square_footage_num corrupted by old parser (and the fix plan)

> Found 2026-06-12. Status: fix coded in scraper; data repair scheduled for after the
> FY2023–2026 backfill completes.

## The finding
TABS print pages render square footage as `40,000 ft 2` (the "2" is the ² of ft²).
The scraper's old `to_int()` stripped every non-digit and concatenated the rest:

```
"40,000 ft 2"  →  "400002"   (≈10× too big, trailing 2 baked in)
"5,818 ft 2"   →  "58182"
```

So **every `projects.square_footage_num` written before the fix is wrong** (any value
whose raw string ends in "ft 2" — i.e. nearly all of them). `square_footage_raw` is
correct; only the derived number is bad. `estimated_cost_num` ("$3,500,000") has no
trailing junk so it is believed fine, but it will be recomputed too as a precaution.

## Blast radius
1. **Local SQLite**: all rows scraped before the fix AND all rows from the currently
   running backfill pass — the running process loaded the old code at startup and keeps
   it until that pass ends. The fixed `to_int()` (first-number-group match: `\d[\d,]*`)
   takes effect on the next scraper invocation.
2. **Supabase**: `sync_to_supabase.py` copies `square_footage_num` straight from SQLite
   (verified — no reparsing from raw), so the cloud column is equally wrong until re-sync.
3. **Analyses**: any filter/band on `square_footage_num`. Concretely: the
   "Devon Arnold 35–58k sqft" emerging-operator finding in FITNESS_PLAYBOOK.md decodes
   to ~3.5–5.8k real sqft (boutique-size, not big-box) — marked for re-check.
   CLUB4/Crunch/EOS sqft figures in the playbook were read from `square_footage_raw`
   and are correct.

## Why no re-scrape is needed
The raw strings are stored on every row. The number is a pure function of the raw
string, so the repair is local arithmetic, no network.

## Fix plan (run after the backfill's ALL DONE marker)
1. **Recompute, one-off script** (`scripts/fix_numeric_cols.py`):
   for every row in `projects`, set
   `square_footage_num = to_int(square_footage_raw)`,
   `estimated_cost_num = to_int(estimated_cost_raw)` using the FIXED parser
   (import it from `scraper/tabs_scraper.py` — single source of truth).
2. **Verify**:
   - 0 rows where recomputed sqft ≠ old sqft but raw is empty (sanity);
   - spot-check 20 random rows against raw strings;
   - distribution check: commercial sqft should mostly fall 500–500,000; count
     out-of-band values (true data-entry outliers like "424,886 ft 2" EOS Katy remain —
     they're the filer's typo, not ours; handle with sanity bounds in queries).
3. **Re-sync to Supabase** for all years (idempotent UPSERT, existing script).
4. **Correct dependent docs**: re-run the emerging-operators query with true sqft;
   update FITNESS_PLAYBOOK.md §D (Devon Arnold et al.) with verified numbers.
5. **Regression guard**: add a tiny unit test for `to_int` covering
   `"40,000 ft 2"→40000`, `"$3,500,000"→3500000`, `""→None`.

## Lesson
Derived columns must be recomputable from stored raw values — this saved us a 70k-page
re-scrape. Keep storing raw alongside parsed, always.
