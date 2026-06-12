import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const devNoAuth = process.env.DEV_NO_AUTH === "true";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user && !devNoAuth) redirect("/login");
  const email = user?.email ?? "dev preview";

  return (
    <div className="grid min-h-dvh grid-cols-[216px_1fr]">
      {/* Sidebar */}
      <aside className="sticky top-0 flex h-dvh flex-col border-r border-line bg-surface">
        <div className="blueprint-grid border-b border-line px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="grid size-6 place-items-center rounded-[var(--radius)] bg-blueprint font-mono text-[11px] font-bold text-white">
              FT
            </span>
            <div className="leading-tight">
              <div className="font-mono text-[12px] font-semibold tracking-wide text-ink">
                FIELD TERMINAL
              </div>
              <div className="label !text-[9px]">TABS Intelligence</div>
            </div>
          </div>
        </div>

        <div className="px-2 py-3">
          <Nav />
        </div>

        <div className="mt-auto border-t border-line px-3 py-3">
          <div className="mb-2 truncate font-mono text-[11px] text-ink-faint">
            {email}
          </div>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="w-full rounded-[var(--radius)] border border-line-strong px-2 py-1.5 text-left text-xs text-ink-soft transition-colors hover:border-rust/40 hover:bg-rust-wash hover:text-rust"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="min-w-0 bg-paper">{children}</main>
    </div>
  );
}
