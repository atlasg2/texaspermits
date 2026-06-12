import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { Pagination } from "@/components/Pagination";
import { ProjectsTable } from "../../projects/ProjectsTable";
import { getView, VIEWS, VIEW_PAGE, type ViewKey } from "@/lib/data/views";

export const dynamic = "force-dynamic";

const THRESHOLD = 40_000;

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
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
  const sqft = one(sp.sqft) as "over" | "under" | undefined;

  const { rows, total } = await getView({
    view: view as ViewKey,
    page,
    sqft: sqft === "over" || sqft === "under" ? sqft : undefined,
    threshold: THRESHOLD,
  });
  const pages = Math.max(1, Math.ceil(total / VIEW_PAGE));

  const chip = (key: "" | "over" | "under", label: string) => {
    const active = (sqft ?? "") === key;
    const qs = key ? `?sqft=${key}` : "";
    return (
      <Link
        href={`/views/${view}${qs}`}
        className={`rounded-[var(--radius)] border px-2.5 py-1.5 font-mono text-xs transition-colors ${
          active
            ? "border-blueprint bg-blueprint text-white"
            : "border-line-strong bg-surface text-ink-soft hover:border-blueprint hover:text-blueprint"
        }`}
      >
        {label}
      </Link>
    );
  };

  const hrefFor = (p: number) =>
    `/views/${view}?${new URLSearchParams({
      ...(sqft ? { sqft } : {}),
      page: String(p),
    }).toString()}`;

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader
        eyebrow="View · the system finds it"
        title={def.label}
        count={`${total.toLocaleString()} projects`}
      >
        <div className="flex items-center gap-1.5">
          {chip("", "All sizes")}
          {chip("over", "≥ 40k sqft")}
          {chip("under", "< 40k sqft")}
        </div>
      </PageHeader>

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

      <div className="flex-1 px-3">
        <ProjectsTable rows={rows} activeSort="" params={{}} />
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
