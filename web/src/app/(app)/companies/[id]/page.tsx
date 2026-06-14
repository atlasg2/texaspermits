import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Badge } from "@/components/Badge";
import { Pagination } from "@/components/Pagination";
import { ProjectFilters } from "@/components/ProjectFilters";
import { ProjectTable } from "@/components/ProjectTable";
import {
  COMPANY_PROJECTS_PAGE,
  getCompanyConnections,
  getCompanyProjects,
  getCompanySummary,
} from "@/lib/data/company";
import { DASH, shortDate, sqft } from "@/lib/format";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

const ROLE_LABEL: Record<string, string> = {
  owner: "Owner",
  tenant: "Tenant / Operator",
  architect: "Architect",
};

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function Section({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[var(--radius)] border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="font-mono text-[14px] font-semibold tracking-wide text-ink">
          {title}
        </h2>
        {meta && <span className="label">{meta}</span>}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

async function ConnectedCompanies({ id }: { id: number }) {
  const connections = (await getCompanyConnections(id)).filter((connection) =>
    ["owner", "tenant", "architect"].includes(connection.role),
  );

  return (
    <Section title="CONNECTED COMPANIES" meta="shared projects">
      {connections.length ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[15px]">
            <thead>
              <tr className="label border-b border-line text-left">
                <th className="px-3 py-2 font-medium">Company</th>
                <th className="px-3 py-2 font-medium">Role</th>
                <th className="px-3 py-2 text-right font-medium">Shared</th>
              </tr>
            </thead>
            <tbody>
              {connections.map((connection) => (
                <tr
                  key={`${connection.company_id}-${connection.role}`}
                  className="group border-b border-line/60 hover:bg-surface-2"
                >
                  <td className="px-3 py-2.5">
                    <Link
                      href={`/companies/${connection.company_id}?companyRole=${connection.role}`}
                      className="font-medium text-ink group-hover:text-blueprint"
                    >
                      {connection.canonical_name}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 text-ink">
                    {ROLE_LABEL[connection.role] ?? connection.role}
                  </td>
                  <td className="tnum px-3 py-2.5 text-right text-ink">
                    {connection.shared.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-[15px] text-ink-soft">
          No other companies share a project with this company.
        </p>
      )}
    </Section>
  );
}

function ConnectionsFallback() {
  return (
    <div className="rounded-[var(--radius)] border border-line bg-surface p-5">
      <div className="h-4 w-48 animate-pulse bg-surface-2" />
      <div className="mt-4 h-20 animate-pulse bg-surface-2" />
    </div>
  );
}

export default async function CompanyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ id: rawId }, sp] = await Promise.all([params, searchParams]);
  const id = Number(rawId);
  if (!Number.isFinite(id)) notFound();

  const page = Number(one(sp.page) ?? "1") || 1;
  const sort = one(sp.sort) ?? "changed";
  const stage = one(sp.stage) ?? "all";

  const [summary, projectResult] = await Promise.all([
    getCompanySummary(id),
    getCompanyProjects(id, {
      q: one(sp.q),
      stage,
      timing: one(sp.timing),
      work: one(sp.work),
      sqft: one(sp.sqft),
      sort,
      page,
    }),
  ]);
  if (!summary) notFound();

  const { company, stat } = summary;
  const { rows, total } = projectResult;
  const pages = Math.max(1, Math.ceil(total / COMPANY_PROJECTS_PAGE));
  const requestedRole = one(sp.companyRole);
  const activeRole =
    requestedRole && stat.roles.includes(requestedRole)
      ? requestedRole
      : stat.roles.length === 1
        ? stat.roles[0]
        : undefined;

  const flat: Record<string, string> = {};
  for (const [key, value] of Object.entries(sp)) {
    const stringValue = one(value);
    if (stringValue) flat[key] = stringValue;
  }
  const basePath = `/companies/${id}`;
  const pageHref = (nextPage: number) => {
    const next = new URLSearchParams(flat);
    next.set("page", String(nextPage));
    return `${basePath}?${next.toString()}`;
  };
  const returnQuery = new URLSearchParams(flat);
  const returnPath = `${basePath}${
    returnQuery.size ? `?${returnQuery.toString()}` : ""
  }`;
  const projectHrefSuffix = `?from=${encodeURIComponent(
    returnPath,
  )}&fromLabel=${encodeURIComponent(company.canonical_name)}`;

  return (
    <div className="min-h-dvh">
      <header className="z-20 border-b border-line bg-paper/90 px-6 pt-5 pb-4 backdrop-blur-sm md:sticky md:top-0">
        <div className="flex flex-wrap items-center gap-2 font-mono text-[13px] text-ink-soft">
          <Link href="/companies" className="hover:text-blueprint">
            Companies
          </Link>
          <span>/</span>
          {activeRole && (
            <>
              <Link
                href={`/companies?role=${activeRole}`}
                className="hover:text-blueprint"
              >
                {ROLE_LABEL[activeRole] ?? activeRole}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-ink">{company.canonical_name}</span>
        </div>

        <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
          <div>
            <h1 className="text-[26px] font-semibold tracking-tight text-ink">
              {company.canonical_name}
            </h1>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {stat.roles.map((role) => (
                <Badge key={role} tone="neutral">
                  {ROLE_LABEL[role] ?? role}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-6 font-mono text-[13px] text-ink-soft">
            <div>
              <div className="text-xl font-semibold text-ink">
                {stat.project_count.toLocaleString()}
              </div>
              projects
            </div>
            <div>
              <div className="text-xl font-semibold text-ink">
                {stat.open_count.toLocaleString()}
              </div>
              open
            </div>
            <div>
              <div className="text-xl font-semibold text-rust">
                {stat.behind_count.toLocaleString()}
              </div>
              behind
            </div>
            <div>
              <div className="text-xl font-semibold text-ink">
                {sqft(stat.largest_project_sqft)}
              </div>
              largest
            </div>
          </div>
        </div>
      </header>

      <main className="flex flex-col gap-5 p-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Section title="PROJECT HISTORY" meta={`${total.toLocaleString()} projects`}>
            <ProjectFilters
              defaultStage="all"
              searchPlaceholder={`Search ${company.canonical_name} projects…`}
            />
          </Section>

          <Section title="COMPANY INFORMATION">
            <dl className="grid gap-4 text-[15px]">
              <div>
                <dt className="label mb-1">Phone</dt>
                <dd className="font-mono text-ink">{company.phone ?? DASH}</dd>
              </div>
              <div>
                <dt className="label mb-1">Address</dt>
                <dd className="text-ink">{company.address ?? DASH}</dd>
              </div>
              <div>
                <dt className="label mb-1">Last filed</dt>
                <dd className="tnum text-ink">{shortDate(stat.last_filed)}</dd>
              </div>
              <div>
                <dt className="label mb-1">Markets</dt>
                <dd className="text-ink">
                  {stat.cities?.length
                    ? stat.cities.slice(0, 12).join(", ")
                    : DASH}
                </dd>
              </div>
              {company.name_variants.length > 1 && (
                <div>
                  <dt className="label mb-1">
                    Filed names ({company.name_variants.length})
                  </dt>
                  <dd className="flex max-h-28 flex-col gap-0.5 overflow-auto font-mono text-[13px] text-ink-soft">
                    {company.name_variants.slice(0, 12).map((variant) => (
                      <span key={variant}>{variant}</span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </Section>
        </div>

        <div className="rounded-[var(--radius)] border border-line bg-surface">
          <ProjectTable
            rows={rows}
            activeSort={sort}
            params={flat}
            basePath={basePath}
            hiddenCompanyRoles={activeRole ? [activeRole] : []}
            projectHrefSuffix={projectHrefSuffix}
          />
          <Pagination
            page={page}
            pages={pages}
            total={total}
            pageSize={COMPANY_PROJECTS_PAGE}
            hrefFor={pageHref}
            unit="projects"
          />
        </div>

        <Suspense fallback={<ConnectionsFallback />}>
          <ConnectedCompanies id={id} />
        </Suspense>

        <Section title="TEAM NOTES">
          <p className="text-[15px] text-ink-soft">
            No notes yet. Team notes and mentions will live here.
          </p>
        </Section>
      </main>
    </div>
  );
}
