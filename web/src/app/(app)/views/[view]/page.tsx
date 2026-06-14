import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { Pagination } from "@/components/Pagination";
import { ViewFilters } from "@/components/ViewFilters";
import { ProjectsTable } from "../../projects/ProjectsTable";
import { getView, VIEWS, VIEW_PAGE, type ViewKey } from "@/lib/data/views";
import { getLists } from "@/lib/data/lists";

export const dynamic = "force-dynamic";

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

function positiveInteger(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

export default async function ViewPage({
  params,
  searchParams,
}: {
  params: Promise<{ view: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { view } = await params;
  const def = VIEWS.find((v) => v.key === view);
  if (!def) notFound();
  const sp = await searchParams;

  const page = Number(one(sp.page) ?? "1") || 1;
  const sort = one(sp.sort) ?? "filed";
  const basePath = `/views/${view}`;
  const flat: Record<string, string> = {};
  for (const [key, value] of Object.entries(sp)) {
    const stringValue = one(value);
    if (stringValue) flat[key] = stringValue;
  }

  const [{ rows, total, hiddenProjectNumbers }, lists] = await Promise.all([
    getView({
      view: view as ViewKey,
      page,
      q: one(sp.q),
      minSqft: positiveInteger(one(sp.minSqft)),
      maxSqft: positiveInteger(one(sp.maxSqft)),
      includeHidden: one(sp.hidden) === "1",
      sort,
    }),
    getLists(),
  ]);
  const pages = Math.max(1, Math.ceil(total / VIEW_PAGE));

  const hrefFor = (p: number) => {
    const next = new URLSearchParams(flat);
    next.set("page", String(p));
    return `${basePath}?${next.toString()}`;
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader
        eyebrow="View · the system finds it"
        title={def.label}
        count={`${total.toLocaleString()} projects`}
      />

      {def.caveat && (
        <div className="mx-6 mt-4 rounded-[var(--radius)] border border-amber/30 bg-amber-wash px-4 py-2.5">
          <span className="label !text-amber">Read this</span>
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-soft">
            {def.caveat}
          </p>
        </div>
      )}

      <div className="mb-2 flex items-center gap-3 px-6 pt-4">
        <Link
          href="/views"
          className="font-mono text-[11px] text-ink-faint hover:text-blueprint"
        >
          ← All views
        </Link>
      </div>

      <div className="flex-1 px-3 pb-3">
        <div className="overflow-hidden rounded-lg border border-line bg-surface">
          <ViewFilters
            key={`${flat.q ?? ""}:${flat.minSqft ?? ""}:${flat.maxSqft ?? ""}:${flat.hidden ?? ""}`}
            params={flat}
            minimumFloor={view === "registered_10k" ? 10_000 : undefined}
          />
          <ProjectsTable
            rows={rows}
            activeSort={sort}
            params={flat}
            basePath={basePath}
            viewKey={view}
            lists={lists.map(({ id, name }) => ({ id, name }))}
            hiddenProjectNumbers={hiddenProjectNumbers}
          />
        </div>
      </div>

      <Pagination
        page={page}
        pages={pages}
        total={total}
        pageSize={VIEW_PAGE}
        hrefFor={hrefFor}
        unit="projects"
      />
    </div>
  );
}
