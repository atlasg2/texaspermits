"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/inbox", label: "Inbox", glyph: "01" },
  { href: "/projects", label: "Projects", glyph: "02" },
  { href: "/companies", label: "Companies", glyph: "03" },
  { href: "/views", label: "Views", glyph: "04" },
  { href: "/lists", label: "Lists", glyph: "05" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5">
      {ITEMS.map((it) => {
        const active =
          pathname === it.href || pathname.startsWith(it.href + "/");
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`group flex items-center gap-2.5 border-l-2 px-3 py-2 text-sm transition-colors ${
              active
                ? "border-blueprint bg-blueprint-wash font-semibold text-blueprint"
                : "border-transparent text-ink-soft hover:bg-surface-2 hover:text-ink"
            }`}
          >
            <span
              className={`font-mono text-[10px] tracking-widest ${
                active ? "text-blueprint" : "text-ink-faint"
              }`}
            >
              {it.glyph}
            </span>
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
