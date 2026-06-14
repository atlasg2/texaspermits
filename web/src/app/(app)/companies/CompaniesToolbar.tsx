"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ROLE_TABS } from "@/lib/filters";

export function CompaniesToolbar({ activeRole }: { activeRole: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [market, setMarket] = useState(params.get("market") ?? "");
  const first = useRef(true);
  const firstMarket = useRef(true);

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    start(() => router.replace(`${pathname}?${next.toString()}`));
  }

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => {
      setParam("q", q.trim());
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  useEffect(() => {
    if (firstMarket.current) {
      firstMarket.current = false;
      return;
    }
    const timeout = setTimeout(() => setParam("market", market.trim()), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [market]);

  function tabHref(role: string) {
    const next = new URLSearchParams(params.toString());
    if (role === "all") next.delete("role");
    else next.set("role", role);
    next.delete("page");
    return `${pathname}?${next.toString()}`;
  }

  const selectClass =
    "appearance-none rounded-[var(--radius)] border border-line-strong bg-surface px-3 py-2.5 font-mono text-sm text-ink outline-none focus:border-blueprint";

  return (
    <div className="flex w-full flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 rounded-[var(--radius)] border border-line bg-surface p-0.5">
        {ROLE_TABS.map((t) => {
          const active = activeRole === t.key;
          return (
            <Link
              key={t.key}
              href={tabHref(t.key)}
              className={`rounded-[2px] px-3 py-2 font-mono text-sm transition-colors ${
                active
                  ? "bg-blueprint text-white"
                  : "text-ink-soft hover:bg-surface-2 hover:text-ink"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      <div className="relative">
        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-sm text-ink-soft">
          ⌕
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Company or market…"
          className="w-64 rounded-[var(--radius)] border border-line-strong bg-surface py-2.5 pr-3 pl-8 font-mono text-sm text-ink outline-none placeholder:text-ink-soft focus:border-blueprint focus:ring-2 focus:ring-blueprint/15"
        />
        {pending && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 animate-pulse font-mono text-xs text-blueprint">
            …
          </span>
        )}
      </div>

      <select
        className={selectClass}
        value={params.get("activity") ?? ""}
        onChange={(event) => setParam("activity", event.target.value)}
        aria-label="Company project activity"
      >
        <option value="">Any project activity</option>
        <option value="open">Has open projects</option>
        <option value="behind">Has behind projects</option>
      </select>

      <select
        className={selectClass}
        value={params.get("recent") ?? ""}
        onChange={(event) => setParam("recent", event.target.value)}
        aria-label="Recently filed projects"
      >
        <option value="">Filed any time</option>
        <option value="30">Filed in 30 days</option>
        <option value="90">Filed in 90 days</option>
        <option value="365">Filed in 1 year</option>
      </select>

      <select
        className={selectClass}
        value={params.get("minProjects") ?? ""}
        onChange={(event) => setParam("minProjects", event.target.value)}
        aria-label="Minimum project count"
      >
        <option value="">Any project count</option>
        <option value="5">5+ projects</option>
        <option value="10">10+ projects</option>
        <option value="25">25+ projects</option>
        <option value="50">50+ projects</option>
      </select>

      <select
        className={selectClass}
        value={params.get("minSqft") ?? ""}
        onChange={(event) => setParam("minSqft", event.target.value)}
        aria-label="Largest associated project"
      >
        <option value="">Any project size</option>
        <option value="10000">Has a 10,000+ sq ft project</option>
        <option value="25000">Has a 25,000+ sq ft project</option>
        <option value="50000">Has a 50,000+ sq ft project</option>
        <option value="100000">Has a 100,000+ sq ft project</option>
      </select>

      <input
        value={market}
        onChange={(event) => setMarket(event.target.value)}
        placeholder="Filter market…"
        className="w-44 rounded-[var(--radius)] border border-line-strong bg-surface px-3 py-2.5 font-mono text-sm text-ink outline-none placeholder:text-ink-soft focus:border-blueprint"
      />
    </div>
  );
}
