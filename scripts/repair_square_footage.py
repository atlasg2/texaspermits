#!/usr/bin/env python3
"""Repair square-footage values parsed with the trailing "ft 2" unit digit."""

import argparse
import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from scraper.tabs_scraper import to_int


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--db", default="data/tabs.db")
    args = parser.parse_args()

    conn = sqlite3.connect(args.db)
    rows = conn.execute(
        "SELECT project_number, square_footage_raw, square_footage_num "
        "FROM projects WHERE square_footage_raw IS NOT NULL "
        "AND trim(square_footage_raw) <> ''"
    ).fetchall()

    repairs = []
    for project_number, raw, current in rows:
        corrected = to_int(raw)
        if corrected != current:
            repairs.append((corrected, project_number))

    with conn:
        conn.executemany(
            "UPDATE projects SET square_footage_num = ? WHERE project_number = ?",
            repairs,
        )
    conn.close()
    print(f"Repaired {len(repairs):,} of {len(rows):,} square-footage values.")


if __name__ == "__main__":
    main()
