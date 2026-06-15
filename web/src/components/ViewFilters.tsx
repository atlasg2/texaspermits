"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

type SizePreset = { label: string; min: string; max: string };

function presetsFor(minimumFloor?: number): SizePreset[] {
  const base: SizePreset[] = [
    { label: "10,000 – 25,000 sq ft", min: "10000", max: "25000" },
    { label: "25,000 – 50,000 sq ft", min: "25000", max: "50000" },
    { label: "50,000 – 100,000 sq ft", min: "50000", max: "100000" },
    { label: "100,000+ sq ft", min: "100000", max: "" },
  ];
  const any: SizePreset = { label: "Any size", min: "", max: "" };
  if (minimumFloor) return [any, ...base];
  return [
    any,
    { label: "Under 10,000 sq ft", min: "", max: "10000" },
    ...base,
  ];
}

export function ViewFilters({
  params,
  minimumFloor,
}: {
  params: Record<string, string>;
  minimumFloor?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();
  const [query, setQuery] = useState(params.q ?? "");
  const firstQuery = useRef(true);

  const presets = presetsFor(minimumFloor);
  const curMin = params.minSqft ?? "";
  const curMax = params.maxSqft ?? "";
  const matchedIndex = presets.findIndex((p) => p.min === curMin && p.max === curMax);
  const hasCustom = matchedIndex === -1 && (curMin !== "" || curMax !== "");

  function replace(next: URLSearchParams) {
    next.delete("page");
    const qs = next.toString();
    start(() => router.replace(`${pathname}${qs ? `?${qs}` : ""}`));
  }

  useEffect(() => {
    if (firstQuery.current) {
      firstQuery.current = false;
      return;
    }
    if (query.trim() === (params.q ?? "")) return;
    const timeout = setTimeout(() => {
      const next = new URLSearchParams(params);
      if (query.trim()) next.set("q", query.trim());
      else next.delete("q");
      replace(next);
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function selectPreset(value: string) {
    const preset = presets[Number(value)];
    if (!preset) return;
    const next = new URLSearchParams(params);
    if (preset.min) next.set("minSqft", preset.min);
    else next.delete("minSqft");
    if (preset.max) next.set("maxSqft", preset.max);
    else next.delete("maxSqft");
    next.delete("sqft");
    replace(next);
  }

  function toggleHidden() {
    const next = new URLSearchParams(params);
    if (params.hidden === "1") next.delete("hidden");
    else next.set("hidden", "1");
    replace(next);
  }

  function reset() {
    setQuery("");
    // Keep the active view; only clear the filters within it.
    const next = new URLSearchParams();
    if (params.view) next.set("view", params.view);
    const qs = next.toString();
    start(() => router.replace(`${pathname}${qs ? `?${qs}` : ""}`));
  }

  const hasFilters =
    Boolean(params.q) ||
    Boolean(params.minSqft) ||
    Boolean(params.maxSqft) ||
    params.hidden === "1";

  return (
    <div className="border-b border-line bg-surface px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search — the primary control, so it leads and gets room. */}
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-faint">
            <SearchIcon />
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search projects, companies, cities…"
            className="h-10 w-full rounded-lg border border-line-strong bg-paper py-2 pr-9 pl-10 text-[14px] text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-blueprint focus:ring-2 focus:ring-blueprint/15"
          />
          {pending && (
            <span className="absolute top-1/2 right-3 -translate-y-1/2 animate-pulse text-[11px] text-blueprint">
              •••
            </span>
          )}
        </div>

        {/* Size — preset ranges instead of free-typed numbers. */}
        <div className="flex items-center gap-2">
          <span className="label whitespace-nowrap">Size</span>
          <select
            value={hasCustom ? "custom" : String(Math.max(0, matchedIndex))}
            onChange={(event) => selectPreset(event.target.value)}
            className="h-10 rounded-lg border border-line-strong bg-paper px-3 pr-8 text-[14px] font-medium text-ink outline-none transition-colors focus:border-blueprint focus:ring-2 focus:ring-blueprint/15"
          >
            {presets.map((preset, index) => (
              <option key={preset.label} value={index}>
                {preset.label}
              </option>
            ))}
            {hasCustom && (
              <option value="custom" disabled>
                Custom ({curMin || "0"}–{curMax || "∞"})
              </option>
            )}
          </select>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={toggleHidden}
            className={`h-10 rounded-lg border px-3 text-[13px] font-medium transition-colors ${
              params.hidden === "1"
                ? "border-blueprint/40 bg-blueprint-wash text-blueprint"
                : "border-line-strong bg-paper text-ink-soft hover:border-blueprint hover:text-blueprint"
            }`}
          >
            {params.hidden === "1" ? "Showing hidden" : "Show hidden"}
          </button>
          {hasFilters && (
            <button
              type="button"
              onClick={reset}
              className="h-10 rounded-lg px-3 text-[13px] font-medium text-ink-faint hover:text-rust"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
