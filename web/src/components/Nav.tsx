"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS: { href: string; label: string; also?: string[] }[] = [
  { href: "/inbox", label: "Inbox" },
  { href: "/views", label: "Views", also: ["/projects"] },
  { href: "/lists", label: "Lists" },
];

export function Nav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5">
      {ITEMS.map((it) => {
        const active =
          pathname === it.href ||
          pathname.startsWith(it.href + "/") ||
          (it.also ?? []).some(
            (p) => pathname === p || pathname.startsWith(p + "/"),
          );
        return (
          <Link
            key={it.href}
            href={it.href}
            onClick={onNavigate}
            className={`flex items-center rounded-md px-2.5 py-1.5 text-sm transition-colors ${
              active
                ? "bg-blueprint-wash font-medium text-blueprint"
                : "text-ink-soft hover:bg-surface-2 hover:text-ink"
            }`}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
