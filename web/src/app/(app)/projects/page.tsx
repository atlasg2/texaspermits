import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { getProjects, PAGE_SIZE } from "@/lib/data/projects";
import { ProjectsToolbar } from "./ProjectsToolbar";
import { ProjectsTable } from "./ProjectsTable";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const page = Number(one(sp.page) ?? "1") || 1;
  const sort = one(sp.sort) ?? "changed";

  const { rows, total } = await getProjects({
    q: one(sp.q),
    status: one(sp.status),
    work: one(sp.work),
    sort,
    page,
  });

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const flat: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp)) {
    const s = one(v);
    if (s) flat[k] = s;
  }
  const pageHref = (p: number) => {
    const next = new URLSearchParams(flat);
    next.set("page", String(p));
    return `/projects?${next.toString()}`;
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader
        eyebrow="The full record"
        title="Projects"
        count={`${total.toLocaleString()} projects`}
      >
        <ProjectsToolbar />
      </PageHeader>

      <div className="flex-1 px-3 py-2">
        <ProjectsTable rows={rows} activeSort={sort} params={flat} />
      </div>

      {/* Pagination */}
      <div className="sticky bottom-0 flex items-center justify-between border-t border-line bg-paper/90 px-6 py-3 backdrop-blur-sm">
        <span className="font-mono text-[11px] text-ink-faint">
          Page {page.toLocaleString()} of {pages.toLocaleString()}
          {" · "}
          {Math.min((page - 1) * PAGE_SIZE + 1, total).toLocaleString()}–
          {Math.min(page * PAGE_SIZE, total).toLocaleString()} of{" "}
          {total.toLocaleString()}
        </span>
        <div className="flex gap-2">
          {page > 1 ? (
            <Link
              href={pageHref(page - 1)}
              className="rounded-[var(--radius)] border border-line-strong bg-surface px-3 py-1.5 font-mono text-xs text-ink-soft hover:border-blueprint hover:text-blueprint"
            >
              ← Prev
            </Link>
          ) : (
            <span className="rounded-[var(--radius)] border border-line bg-surface px-3 py-1.5 font-mono text-xs text-ink-faint opacity-50">
              ← Prev
            </span>
          )}
          {page < pages ? (
            <Link
              href={pageHref(page + 1)}
              className="rounded-[var(--radius)] border border-line-strong bg-surface px-3 py-1.5 font-mono text-xs text-ink-soft hover:border-blueprint hover:text-blueprint"
            >
              Next →
            </Link>
          ) : (
            <span className="rounded-[var(--radius)] border border-line bg-surface px-3 py-1.5 font-mono text-xs text-ink-faint opacity-50">
              Next →
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
