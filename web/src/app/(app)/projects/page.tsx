import { PageHeader } from "@/components/PageHeader";
import { Pagination } from "@/components/Pagination";
import { ViewSwitcher } from "@/components/ViewSwitcher";
import { ViewFilters } from "@/components/ViewFilters";
import { StageFilter } from "@/components/StageFilter";
import { getProjects, PAGE_SIZE } from "@/lib/data/projects";
import { getView, VIEW_PAGE, VIEWS } from "@/lib/data/views";
import { getLists } from "@/lib/data/lists";
import { ProjectsToolbar } from "./ProjectsToolbar";
import { ProjectsTable } from "./ProjectsTable";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function positiveInteger(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const page = Number(one(sp.page) ?? "1") || 1;

  const flat: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp)) {
    const s = one(v);
    if (s) flat[k] = s;
  }

  const def = VIEWS.find((v) => v.key === one(sp.view));

  // ── A named view (Registered 10k+, Active, …) ────────────────────────────
  if (def) {
    const sort = one(sp.sort) ?? "filed";
    const [{ rows, total, hiddenProjectNumbers }, lists] = await Promise.all([
      getView({
        view: def.key,
        page,
        q: one(sp.q),
        minSqft: positiveInteger(one(sp.minSqft)),
        maxSqft: positiveInteger(one(sp.maxSqft)),
        includeHidden: one(sp.hidden) === "1",
        sort,
        stage: def.key === "gym" ? one(sp.stage) : undefined,
      }),
      getLists(),
    ]);
    const pages = Math.max(1, Math.ceil(total / VIEW_PAGE));
    const hrefFor = (p: number) => {
      const next = new URLSearchParams(flat);
      next.set("page", String(p));
      return `/projects?${next.toString()}`;
    };

    return (
      <div className="flex min-h-dvh flex-col">
        <PageHeader title="Projects" count={`${total.toLocaleString()} projects`} />
        <ViewSwitcher active={def.key} />

        {def.caveat && (
          <div className="mx-4 mb-3 rounded-[var(--radius)] border border-amber/30 bg-amber-wash px-4 py-2.5">
            <span className="label !text-amber">Read this</span>
            <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-soft">
              {def.caveat}
            </p>
          </div>
        )}

        <div className="flex-1 px-3 pb-3">
          <div className="overflow-hidden rounded-lg border border-line bg-surface">
            <ViewFilters
              key={`${def.key}:${flat.q ?? ""}:${flat.minSqft ?? ""}:${flat.maxSqft ?? ""}:${flat.hidden ?? ""}`}
              params={flat}
              minimumFloor={def.key === "prospects" ? 10_000 : undefined}
            />
            {def.key === "gym" && (
              <StageFilter params={flat} active={one(sp.stage)} />
            )}
            <ProjectsTable
              rows={rows}
              activeSort={sort}
              params={flat}
              basePath="/projects"
              viewKey={def.key}
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

  // ── All projects (default) ───────────────────────────────────────────────
  const sort = one(sp.sort) ?? "changed";
  const { rows, total } = await getProjects({
    q: one(sp.q),
    stage: one(sp.stage) ?? "open",
    timing: one(sp.timing),
    work: one(sp.work),
    sqft: one(sp.sqft),
    sort,
    page,
  });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hrefFor = (p: number) => {
    const next = new URLSearchParams(flat);
    next.set("page", String(p));
    return `/projects?${next.toString()}`;
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="Projects" count={`${total.toLocaleString()} projects`} />
      <ViewSwitcher active="all" />

      <div className="flex-1 px-3 pb-3">
        <div className="overflow-hidden rounded-lg border border-line bg-surface">
          <ProjectsToolbar />
          <ProjectsTable rows={rows} activeSort={sort} params={flat} />
        </div>
      </div>

      <Pagination
        page={page}
        pages={pages}
        total={total}
        pageSize={PAGE_SIZE}
        hrefFor={hrefFor}
        unit="projects"
      />
    </div>
  );
}
