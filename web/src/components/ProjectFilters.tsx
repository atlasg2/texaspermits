"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  SQFT_OPTIONS,
  STAGE_OPTIONS,
  TIMING_OPTIONS,
  WORK_OPTIONS,
} from "@/lib/filters";

const STAGE_LABEL = new Map(STAGE_OPTIONS.map((o) => [o.value, o.label]));
const TIMING_LABEL = new Map(TIMING_OPTIONS.map((o) => [o.value, o.label]));
const SQFT_LABEL = new Map(SQFT_OPTIONS.map((o) => [o.value, o.label]));

function SearchIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function FilterSelect({
  label,
  value,
  active,
  onChange,
  children,
}: {
  label: string;
  value: string;
  active: boolean;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        aria-label={label}
        title={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`h-8 cursor-pointer appearance-none rounded-md border bg-surface pr-7 pl-2.5 text-[13px] outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/15 ${
          active
            ? "border-blueprint/40 text-ink"
            : "border-line-strong text-ink-soft"
        }`}
      >
        {children}
      </select>
      <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-[9px] text-ink-faint">
        ▼
      </span>
    </div>
  );
}

function Chip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <button
      type="button"
      onClick={onClear}
      className="inline-flex items-center gap-1.5 rounded-full border border-blueprint/30 bg-blueprint-wash py-0.5 pr-1.5 pl-2.5 text-[12px] font-medium text-blueprint hover:border-blueprint"
    >
      {label}
      <span className="text-[13px] leading-none text-blueprint/60">×</span>
    </button>
  );
}

export function ProjectFilters({
  searchPlaceholder = "Search projects, companies, cities…",
  defaultStage = "open",
}: {
  searchPlaceholder?: string;
  defaultStage?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");
  const first = useRef(true);

  function push(next: URLSearchParams) {
    next.delete("page");
    start(() => router.replace(`${pathname}?${next.toString()}`));
  }

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    push(next);
  }

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const timeout = setTimeout(() => setParam("q", q.trim()), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const stage = params.get("stage") ?? defaultStage;
  const timing = params.get("timing") ?? "";
  const work = params.get("work") ?? "";
  const sqftValue = params.get("sqft") ?? "";

  // Active-filter chips — anything narrowing the view away from its default.
  const chips: { label: string; clear: () => void }[] = [];
  if (q.trim())
    chips.push({ label: `“${q.trim()}”`, clear: () => setQ("") });
  if (stage !== defaultStage)
    chips.push({
      label: STAGE_LABEL.get(stage) ?? stage,
      clear: () => setParam("stage", ""),
    });
  if (timing)
    chips.push({
      label: TIMING_LABEL.get(timing) ?? timing,
      clear: () => setParam("timing", ""),
    });
  if (work) chips.push({ label: work, clear: () => setParam("work", "") });
  if (sqftValue)
    chips.push({
      label: SQFT_LABEL.get(sqftValue) ?? sqftValue,
      clear: () => setParam("sqft", ""),
    });

  return (
    <div className="border-b border-line bg-surface">
      <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
        <div className="relative w-full sm:w-auto">
          <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-ink-faint">
            <SearchIcon />
          </span>
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-8 w-full rounded-md border border-line-strong bg-surface py-1.5 pr-7 pl-8 text-[13px] text-ink outline-none placeholder:text-ink-faint focus:border-blueprint focus:ring-2 focus:ring-blueprint/15 sm:w-72"
          />
          {pending && (
            <span className="absolute top-1/2 right-2.5 -translate-y-1/2 animate-pulse text-[11px] text-blueprint">
              •••
            </span>
          )}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <FilterSelect
            label="Project status or attention filter"
            value={stage}
            active={stage !== defaultStage}
            onChange={(value) =>
              setParam("stage", value === defaultStage ? "" : value)
            }
          >
            {STAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            label="Estimated timing filter"
            value={timing}
            active={timing !== ""}
            onChange={(value) => setParam("timing", value)}
          >
            {TIMING_OPTIONS.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            label="Work type filter"
            value={work}
            active={work !== ""}
            onChange={(value) => setParam("work", value)}
          >
            <option value="">All work types</option>
            {WORK_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            label="Minimum square footage"
            value={sqftValue}
            active={sqftValue !== ""}
            onChange={(value) => setParam("sqft", value)}
          >
            {SQFT_OPTIONS.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </FilterSelect>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 px-3 pb-2.5">
          {chips.map((chip, index) => (
            <Chip key={index} label={chip.label} onClear={chip.clear} />
          ))}
        </div>
      )}
    </div>
  );
}
