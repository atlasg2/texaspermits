import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/Badge";
import {
  DataTableFrame,
  SortHead,
  TableEmpty,
} from "@/components/DataTable";
import { Pagination } from "@/components/Pagination";
import {
  getCompanies,
  COMPANIES_PAGE,
  type CompanyRoleTab,
} from "@/lib/data/companies";
import { CompaniesToolbar } from "./CompaniesToolbar";
import { DASH, shortDate, sqft } from "@/lib/format";
import type { Tone } from "@/lib/schedule";

export const dynamic = "force-dynamic";

const ROLE_TONE: Record<string, Tone> = {
  owner: "slate",
  tenant: "blueprint",
  architect: "grass",
  filer: "neutral",
};
const ROLE_SHORT: Record<string, string> = {
  owner: "Owner",
  tenant: "Tenant / Operator",
  architect: "Architect",
  filer: "Filer",
};

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const requestedRole = one(sp.role) ?? "all";
  const role = (
    ["all", "owner", "tenant", "architect"].includes(requestedRole)
      ? requestedRole
      : "all"
  ) as CompanyRoleTab;
  const page = Number(one(sp.page) ?? "1") || 1;
  const sort = one(sp.sort) ?? "projects";

  const { rows, total } = await getCompanies({
    role,
    q: one(sp.q),
    activity: one(sp.activity),
    recent: one(sp.recent),
    minProjects: one(sp.minProjects),
    minSqft: one(sp.minSqft),
    market: one(sp.market),
    sort,
    page,
  });
  const pages = Math.max(1, Math.ceil(total / COMPANIES_PAGE));

  const flat: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp)) {
    const s = one(v);
    if (s) flat[k] = s;
  }
  const hrefFor = (p: number) => {
    const next = new URLSearchParams(flat);
    next.set("page", String(p));
    return `/companies?${next.toString()}`;
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader
        title="Companies"
        count={`${total.toLocaleString()} companies`}
      />

      <div className="flex-1 p-4">
        <div className="overflow-hidden rounded-lg border border-line bg-surface">
        <CompaniesToolbar activeRole={role} />
        <DataTableFrame
          empty={
            !rows.length ? (
              <TableEmpty message="Try a different role, market, or project filter." />
            ) : undefined
          }
        >
          <table className="w-full border-collapse text-[15px]">
            <thead>
              <tr className="label border-b border-line-strong text-left">
                <SortHead
                  basePath="/companies"
                  col="name"
                  label="Company"
                  activeSort={sort}
                  params={flat}
                />
                <th className="px-3 py-2 font-medium">Roles</th>
                <SortHead
                  basePath="/companies"
                  col="projects"
                  label="Projects"
                  align="text-right"
                  activeSort={sort}
                  params={flat}
                />
                <SortHead
                  basePath="/companies"
                  col="open"
                  label="Open"
                  align="text-right"
                  activeSort={sort}
                  params={flat}
                />
                <SortHead
                  basePath="/companies"
                  col="behind"
                  label="Behind"
                  align="text-right"
                  activeSort={sort}
                  params={flat}
                />
                <SortHead
                  basePath="/companies"
                  col="largest"
                  label="Largest Project"
                  align="text-right"
                  activeSort={sort}
                  params={flat}
                />
                <SortHead
                  basePath="/companies"
                  col="filed"
                  label="Last Filed"
                  activeSort={sort}
                  params={flat}
                />
                <th className="min-w-64 px-3 py-2 font-medium">Markets</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((company) => {
                const roleQuery =
                  role === "all" ? "" : `?companyRole=${role}`;
                return (
                  <tr
                    key={company.company_id}
                    className="group border-b border-line align-top transition-colors hover:bg-surface-2"
                  >
                    <td className="px-3 py-2.5">
                      <Link
                        href={`/companies/${company.company_id}${roleQuery}`}
                        className="font-medium text-ink group-hover:text-blueprint"
                      >
                        {company.canonical_name}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {company.roles.map((companyRole) => (
                          <Badge
                            key={companyRole}
                            tone={ROLE_TONE[companyRole] ?? "neutral"}
                          >
                            {ROLE_SHORT[companyRole] ?? companyRole}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="tnum px-3 py-2.5 text-right text-ink">
                      {company.project_count.toLocaleString()}
                    </td>
                    <td className="tnum px-3 py-2.5 text-right text-ink">
                      {company.open_count.toLocaleString()}
                    </td>
                    <td className="tnum px-3 py-2.5 text-right text-rust">
                      {company.behind_count.toLocaleString()}
                    </td>
                    <td className="tnum px-3 py-2.5 text-right text-ink">
                      {sqft(company.largest_project_sqft)}
                    </td>
                    <td className="tnum px-3 py-2.5 whitespace-nowrap text-ink">
                      {shortDate(company.last_filed)}
                    </td>
                    <td className="px-3 py-2.5 text-ink">
                      {company.cities?.length
                        ? company.cities.slice(0, 4).join(", ") +
                          (company.cities.length > 4
                            ? ` +${company.cities.length - 4}`
                            : "")
                        : DASH}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </DataTableFrame>
        </div>
      </div>

      <Pagination
        page={page}
        pages={pages}
        total={total}
        pageSize={COMPANIES_PAGE}
        hrefFor={hrefFor}
        unit="companies"
      />
    </div>
  );
}
