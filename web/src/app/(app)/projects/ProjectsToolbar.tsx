"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { STATUS_OPTIONS, WORK_OPTIONS } from "@/lib/filters";

export function ProjectsToolbar() {
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

  // debounce the search box
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => setParam("q", q.trim()), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const selectCls =
    "appearance-none rounded-[var(--radius)] border border-line-strong bg-surface px-2.5 py-2 font-mono text-xs text-ink-soft outline-none focus:border-blueprint";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-xs text-ink-faint">
          ⌕
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search projects, companies, cities…"
          className="w-72 rounded-[var(--radius)] border border-line-strong bg-surface py-2 pr-3 pl-7 font-mono text-xs text-ink outline-none placeholder:text-ink-faint focus:border-blueprint focus:ring-2 focus:ring-blueprint/15"
        />
        {pending && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 animate-pulse font-mono text-[10px] text-blueprint">
            …
          </span>
        )}
      </div>

      <select
        className={selectCls}
        value={params.get("status") ?? ""}
        onChange={(e) => setParam("status", e.target.value)}
      >
        <option value="">All statuses</option>
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <select
        className={selectCls}
        value={params.get("work") ?? ""}
        onChange={(e) => setParam("work", e.target.value)}
      >
        <option value="">All work types</option>
        {WORK_OPTIONS.map((w) => (
          <option key={w} value={w}>
            {w}
          </option>
        ))}
      </select>
    </div>
  );
}
