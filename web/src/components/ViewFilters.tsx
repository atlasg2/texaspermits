"use client";

import { FormEvent, useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

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
  const [minimum, setMinimum] = useState(params.minSqft ?? "");
  const [maximum, setMaximum] = useState(params.maxSqft ?? "");
  const firstQuery = useRef(true);

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
    // params is intentionally represented by its serialized values above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function applySquareFootage(event: FormEvent) {
    event.preventDefault();
    const next = new URLSearchParams(params);
    if (minimum) next.set("minSqft", minimum);
    else next.delete("minSqft");
    if (maximum) next.set("maxSqft", maximum);
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
    start(() => router.replace(pathname));
  }

  const hasFilters =
    Boolean(params.q) ||
    Boolean(params.minSqft) ||
    Boolean(params.maxSqft) ||
    params.hidden === "1";

  return (
    <div className="border-b border-line bg-surface px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-auto">
          <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-ink-faint">
            <SearchIcon />
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search projects, companies, cities…"
            className="h-8 w-full rounded-md border border-line-strong bg-surface py-1.5 pr-8 pl-8 text-[13px] text-ink outline-none placeholder:text-ink-faint focus:border-blueprint focus:ring-2 focus:ring-blueprint/15 sm:w-72"
          />
          {pending && (
            <span className="absolute top-1/2 right-2.5 -translate-y-1/2 animate-pulse text-[11px] text-blueprint">
              •••
            </span>
          )}
        </div>

        <form
          onSubmit={applySquareFootage}
          className="flex flex-wrap items-center gap-1.5"
        >
          <span className="label px-1">Square feet</span>
          <input
            type="number"
            min={minimumFloor ?? 0}
            step="1000"
            inputMode="numeric"
            value={minimum}
            onChange={(event) => setMinimum(event.target.value)}
            placeholder={
              minimumFloor ? minimumFloor.toLocaleString() : "Minimum"
            }
            aria-label="Minimum square footage"
            className="h-8 w-28 rounded-md border border-line-strong bg-surface px-2.5 text-[13px] text-ink outline-none placeholder:text-ink-faint focus:border-blueprint focus:ring-2 focus:ring-blueprint/15"
          />
          <span className="text-[12px] text-ink-faint">to</span>
          <input
            type="number"
            min={minimumFloor ?? 0}
            step="1000"
            inputMode="numeric"
            value={maximum}
            onChange={(event) => setMaximum(event.target.value)}
            placeholder="Maximum"
            aria-label="Maximum square footage"
            className="h-8 w-28 rounded-md border border-line-strong bg-surface px-2.5 text-[13px] text-ink outline-none placeholder:text-ink-faint focus:border-blueprint focus:ring-2 focus:ring-blueprint/15"
          />
          <button
            type="submit"
            disabled={pending}
            className="h-8 rounded-md border border-line-strong bg-surface px-2.5 text-[12px] font-medium text-ink-soft hover:border-blueprint hover:text-blueprint disabled:opacity-50"
          >
            Apply
          </button>
        </form>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={toggleHidden}
            className={`h-8 rounded-md border px-2.5 text-[12px] font-medium ${
              params.hidden === "1"
                ? "border-blueprint/40 bg-blueprint-wash text-blueprint"
                : "border-line-strong bg-surface text-ink-soft hover:border-blueprint hover:text-blueprint"
            }`}
          >
            {params.hidden === "1" ? "Showing hidden" : "Show hidden"}
          </button>
          {hasFilters && (
            <button
              type="button"
              onClick={reset}
              className="h-8 px-2 text-[12px] font-medium text-ink-faint hover:text-rust"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
