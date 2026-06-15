"use client";

import { useEffect, useState } from "react";
import { Nav } from "@/components/Nav";
import { ThemeToggle } from "@/components/ThemeToggle";

const STORAGE_KEY = "field-terminal-sidebar-hidden";

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}

export function AppShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  // Desktop: persistent column that can be collapsed (remembered).
  const [hidden, setHidden] = useState(false);
  // Mobile: off-canvas drawer, closed by default.
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const restore = window.setTimeout(() => {
      setHidden(window.localStorage.getItem(STORAGE_KEY) === "true");
    }, 0);
    return () => window.clearTimeout(restore);
  }, []);

  function setSidebarHidden(next: boolean) {
    setHidden(next);
    window.localStorage.setItem(STORAGE_KEY, String(next));
  }

  return (
    <div className="min-h-dvh">
      {/* Sidebar — fixed on every size; a drawer on mobile, a column on md+. */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-[232px] flex-col overflow-hidden border-r border-line bg-surface transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${hidden ? "md:-translate-x-full" : "md:translate-x-0"}`}
      >
        <div className="px-4 py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="grid size-7 shrink-0 place-items-center rounded-md bg-blueprint text-[12px] font-bold text-white">
                FT
              </span>
              <div className="min-w-0 leading-tight">
                <div className="truncate text-[14px] font-semibold text-ink">
                  Field Terminal
                </div>
                <div className="text-[12px] text-ink-faint">
                  TABS intelligence
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                setSidebarHidden(true);
              }}
              className="grid size-7 shrink-0 place-items-center rounded-md text-ink-faint hover:bg-surface-2 hover:text-ink"
              aria-label="Hide navigation"
              title="Hide navigation"
            >
              ‹
            </button>
          </div>
        </div>

        <div className="px-2.5">
          <Nav onNavigate={() => setMobileOpen(false)} />
        </div>

        <div className="mt-auto border-t border-line px-3 py-3">
          <div className="mb-1.5">
            <ThemeToggle />
          </div>
          <div className="mb-2 truncate px-2.5 text-[13px] text-ink-faint">{email}</div>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="w-full rounded-md px-2.5 py-2 text-left text-sm text-ink-soft transition-colors hover:bg-rust-wash hover:text-rust"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-ink/30 md:hidden"
        />
      )}

      {/* Content column — padded for the sidebar on md+, full width on mobile. */}
      <div
        className={`flex min-h-dvh flex-col transition-[padding] duration-200 ${
          hidden ? "md:pl-0" : "md:pl-[232px]"
        }`}
      >
        {/* Mobile top bar with the menu button. */}
        <div className="sticky top-0 z-30 flex items-center gap-2.5 border-b border-line bg-paper/90 px-3 py-2.5 backdrop-blur-sm md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="grid size-8 place-items-center rounded-md border border-line-strong bg-surface text-ink-soft hover:border-blueprint hover:text-blueprint"
            aria-label="Open navigation"
          >
            <MenuIcon />
          </button>
          <span className="text-[14px] font-semibold text-ink">Field Terminal</span>
        </div>

        {/* Desktop "show nav" affordance when the column is collapsed. */}
        {hidden && (
          <button
            type="button"
            onClick={() => setSidebarHidden(false)}
            className="fixed top-3 left-3 z-40 hidden size-8 place-items-center rounded-md border border-line-strong bg-surface/95 text-ink-soft shadow-sm backdrop-blur hover:border-blueprint hover:text-blueprint md:grid"
            aria-label="Show navigation"
            title="Show navigation"
          >
            ›
          </button>
        )}

        <main className="relative min-w-0 flex-1 bg-paper">{children}</main>
      </div>
    </div>
  );
}
