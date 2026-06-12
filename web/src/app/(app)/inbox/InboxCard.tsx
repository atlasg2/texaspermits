"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/Badge";
import {
  reviewAndOpen,
  setInboxState,
  addInboxToList,
} from "@/lib/actions";
import { money, sqft, shortDate, DASH } from "@/lib/format";
import { statusTone } from "@/lib/schedule";
import type { InboxItem } from "@/lib/data/inbox";
import type { Tone } from "@/lib/schedule";

const REASON: Record<string, { label: string; tone: Tone }> = {
  new_project: { label: "New project", tone: "blueprint" },
  status: { label: "Status change", tone: "grass" },
  completion_date: { label: "Completion changed", tone: "amber" },
  start_date: { label: "Start changed", tone: "amber" },
  cost: { label: "Cost changed", tone: "slate" },
  mention: { label: "You were mentioned", tone: "rust" },
};

export function InboxCard({
  item,
  watchlistId,
  followupId,
}: {
  item: InboxItem;
  watchlistId: number | null;
  followupId: number | null;
}) {
  const [pending, start] = useTransition();
  const [added, setAdded] = useState<string | null>(null);
  const r = REASON[item.reason] ?? { label: item.reason, tone: "neutral" as Tone };

  return (
    <div className="rounded-[var(--radius)] border border-line bg-surface p-4 transition-shadow hover:shadow-[0_1px_0_var(--color-line-strong)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <Badge tone={r.tone} dot>
              {r.label}
            </Badge>
            {item.city && (
              <span className="text-[12px] text-ink-faint">{item.city}</span>
            )}
          </div>
          <button
            onClick={() => start(() => reviewAndOpen(item.id, item.project_number))}
            className="text-left text-[15px] font-semibold text-ink hover:text-blueprint"
          >
            {item.title}
          </button>
          <div className="mt-0.5 font-mono text-[10px] text-ink-faint">
            {item.project_number}
          </div>
        </div>
        {item.status && (
          <Badge tone={statusTone(item.status)}>{item.status}</Badge>
        )}
      </div>

      {/* why it appeared */}
      <ul className="mt-3 space-y-0.5">
        {item.reason_bullets.map((b, i) => (
          <li key={i} className="flex gap-1.5 text-[12.5px] text-ink-soft">
            <span className="text-ink-faint">·</span>
            {b}
          </li>
        ))}
      </ul>

      {/* facts */}
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 border-t border-line pt-2.5 font-mono text-[11px] text-ink-faint">
        <span>
          sqft <span className="tnum text-ink">{sqft(item.sqft)}</span>
        </span>
        <span>
          est <span className="tnum text-ink">{money(item.cost)}</span>
        </span>
        <span>
          done{" "}
          <span className="tnum text-ink">
            {item.completion ? shortDate(item.completion) : DASH}
          </span>
        </span>
      </div>

      {/* actions */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          disabled={pending}
          onClick={() => start(() => reviewAndOpen(item.id, item.project_number))}
          className="rounded-[var(--radius)] bg-blueprint px-2.5 py-1.5 font-mono text-[11px] font-medium text-white hover:bg-blueprint-bright disabled:opacity-50"
        >
          Review →
        </button>

        {watchlistId && (
          <button
            disabled={pending || added === "w"}
            onClick={() =>
              start(async () => {
                await addInboxToList(item.id, watchlistId, item.project_number);
                setAdded("w");
              })
            }
            className="rounded-[var(--radius)] border border-line-strong bg-surface px-2.5 py-1.5 font-mono text-[11px] text-ink-soft hover:border-blueprint hover:text-blueprint disabled:opacity-50"
          >
            {added === "w" ? "On Watchlist ✓" : "+ Watchlist"}
          </button>
        )}
        {followupId && (
          <button
            disabled={pending || added === "f"}
            onClick={() =>
              start(async () => {
                await addInboxToList(item.id, followupId, item.project_number);
                setAdded("f");
              })
            }
            className="rounded-[var(--radius)] border border-line-strong bg-surface px-2.5 py-1.5 font-mono text-[11px] text-ink-soft hover:border-blueprint hover:text-blueprint disabled:opacity-50"
          >
            {added === "f" ? "On Follow-Up ✓" : "+ Follow-Up"}
          </button>
        )}

        <button
          disabled={pending}
          onClick={() => start(() => setInboxState(item.id, "dismissed"))}
          className="ml-auto rounded-[var(--radius)] px-2.5 py-1.5 font-mono text-[11px] text-ink-faint hover:text-rust disabled:opacity-50"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
