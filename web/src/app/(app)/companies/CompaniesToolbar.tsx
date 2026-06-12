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
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      const v = q.trim();
      if (v) next.set("q", v);
      else next.delete("q");
      next.delete("page");
      start(() => router.replace(`${pathname}?${next.toString()}`));
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function tabHref(role: string) {
    const next = new URLSearchParams(params.toString());
    if (role === "all") next.delete("role");
    else next.set("role", role);
    next.delete("page");
    return `${pathname}?${next.toString()}`;
  }

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-1 rounded-[var(--radius)] border border-line bg-surface p-0.5">
        {ROLE_TABS.map((t) => {
          const active = activeRole === t.key;
          return (
            <Link
              key={t.key}
              href={tabHref(t.key)}
              className={`rounded-[2px] px-3 py-1.5 font-mono text-xs transition-colors ${
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
        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-xs text-ink-faint">
          ⌕
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search companies…"
          className="w-64 rounded-[var(--radius)] border border-line-strong bg-surface py-2 pr-3 pl-7 font-mono text-xs text-ink outline-none placeholder:text-ink-faint focus:border-blueprint focus:ring-2 focus:ring-blueprint/15"
        />
        {pending && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 animate-pulse font-mono text-[10px] text-blueprint">
            …
          </span>
        )}
      </div>
    </div>
  );
}
