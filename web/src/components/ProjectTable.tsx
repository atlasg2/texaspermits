import Link from "next/link";
import { Badge } from "@/components/Badge";
import {
  DataTableFrame,
  SortHead,
  TableEmpty,
} from "@/components/DataTable";
import { money, sqft, shortDate, relative, firstLine, DASH } from "@/lib/format";
import {
  isBehindEstimate,
  isStaleRegistration,
  statusLabel,
  statusTone,
} from "@/lib/schedule";
import type { CompanyRef, ProjectRow } from "@/lib/data/projects";
import {
  ProjectRowActions,
  type ProjectListOption,
} from "@/components/ProjectRowActions";

const WORK_SHORT: Record<string, string> = {
  "Renovation/Alteration": "Reno",
  "New Construction": "New",
  "Additions to Existing Building": "Add",
};

const COMPANY_COLUMNS = [
  { role: "tenant", label: "Tenant / Operator" },
  { role: "architect", label: "Architect" },
  { role: "owner", label: "Owner" },
] as const;

function CompanyRoleCell({
  companies,
  role,
}: {
  companies: CompanyRef[];
  role: string;
}) {
  const company = companies.find((candidate) => candidate.role === role);
  if (!company) return <span className="text-ink-soft">{DASH}</span>;

  return (
    <span
      className="block max-w-[190px] truncate font-medium text-ink"
      title={company.name}
    >
      {company.name}
    </span>
  );
}

export function ProjectTable({
  rows,
  activeSort,
  params,
  basePath = "/projects",
  hiddenCompanyRoles = [],
  projectHrefSuffix = "",
  viewKey,
  lists = [],
  hiddenProjectNumbers = [],
}: {
  rows: ProjectRow[];
  activeSort: string;
  params: Record<string, string>;
  basePath?: string;
  hiddenCompanyRoles?: string[];
  projectHrefSuffix?: string;
  viewKey?: string;
  lists?: ProjectListOption[];
  hiddenProjectNumbers?: string[];
}) {
  const companyColumns = COMPANY_COLUMNS.filter(
    (column) => !hiddenCompanyRoles.includes(column.role),
  );
  const hidden = new Set(hiddenProjectNumbers);

  return (
    <DataTableFrame
      empty={!rows.length ? <TableEmpty /> : undefined}
    >
      <table className="w-full min-w-full border-collapse text-[15px]">
        <thead>
          <tr className="border-b-2 border-line-strong text-left text-[12px] font-semibold tracking-wide text-ink-soft uppercase">
            <th className="min-w-60 px-3 py-2 font-medium">Project</th>
            <th className="px-3 py-2 font-medium">City</th>
            <th className="px-3 py-2 font-medium">TABS Stage</th>
            <th className="px-3 py-2 font-medium">Type</th>
            <SortHead
              basePath={basePath}
              col="sqft"
              label="Sq Ft"
              align="text-right"
              activeSort={activeSort}
              params={params}
            />
            <SortHead
              basePath={basePath}
              col="cost"
              label="Est. Cost"
              align="text-right"
              activeSort={activeSort}
              params={params}
            />
            <th className="min-w-64 px-3 py-2 font-medium">Scope</th>
            <SortHead
              basePath={basePath}
              col="filed"
              label="Registered"
              activeSort={activeSort}
              params={params}
            />
            <SortHead
              basePath={basePath}
              col="start"
              label="Est. Start"
              activeSort={activeSort}
              params={params}
            />
            <SortHead
              basePath={basePath}
              col="completion"
              label="Est. Completion"
              activeSort={activeSort}
              params={params}
            />
            {companyColumns.map((column) => (
              <th
                key={column.role}
                className="min-w-40 px-3 py-2 font-medium"
              >
                {column.label}
              </th>
            ))}
            <SortHead
              basePath={basePath}
              col="changed"
              label="Changed"
              activeSort={activeSort}
              params={params}
            />
            {viewKey && (
              <th className="px-3 py-2 text-right font-medium">Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const rowHidden = hidden.has(row.project_number);
            const staleRegistration = isStaleRegistration(
              row.current_status,
              row.completion_date,
            );
            const behindEstimate = isBehindEstimate(
              row.current_status,
              row.completion_date,
            );
            const title =
              row.project_name || row.facility_name || row.project_number;

            return (
              <tr
                key={row.project_number}
                className={`group border-b border-line align-top transition-colors hover:bg-surface-2 ${
                  rowHidden ? "bg-surface-2 opacity-65" : ""
                }`}
              >
                <td className="px-3 py-2.5">
                  <Link
                    href={`/projects/${row.project_number}${projectHrefSuffix}`}
                    className="block"
                  >
                    <div className="font-medium text-ink group-hover:text-blueprint">
                      {title}
                    </div>
                  </Link>
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap font-medium text-ink">
                  {row.location_city ?? DASH}
                </td>
                <td className="px-3 py-2.5">
                  <Badge tone={statusTone(row.current_status)} dot>
                    {statusLabel(row.current_status)}
                  </Badge>
                  {staleRegistration && (
                    <div
                      className="mt-1"
                      title="Still registered after the filer-estimated completion date. This is an investigation flag, not proof the project failed."
                    >
                      <Badge tone="amber" dot>
                        Stale registration
                      </Badge>
                    </div>
                  )}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap font-medium text-ink">
                  {row.type_of_work
                    ? (WORK_SHORT[row.type_of_work] ?? row.type_of_work)
                    : DASH}
                </td>
                <td className="tnum px-3 py-2.5 text-right font-medium text-ink">
                  {sqft(row.square_footage)}
                </td>
                <td
                  className="tnum px-3 py-2.5 text-right font-medium text-ink"
                  title="Filer's self-reported estimate"
                >
                  {money(row.estimated_cost)}
                </td>
                <td
                  className="max-w-80 px-3 py-2.5 text-[14px] leading-relaxed text-ink"
                  title={row.scope_of_work ?? undefined}
                >
                  <span className="line-clamp-2">
                    {firstLine(row.scope_of_work, 110)}
                  </span>
                </td>
                <td className="tnum px-3 py-2.5 whitespace-nowrap font-medium text-ink">
                  {shortDate(row.registration_date)}
                </td>
                <td className="tnum px-3 py-2.5 whitespace-nowrap font-medium text-ink">
                  {shortDate(row.start_date)}
                </td>
                <td className="tnum px-3 py-2.5 whitespace-nowrap font-medium text-ink">
                  <div>{shortDate(row.completion_date)}</div>
                  {behindEstimate && (
                    <div className="mt-1">
                      <Badge tone="rust" dot>
                        Behind estimate
                      </Badge>
                    </div>
                  )}
                </td>
                {companyColumns.map((column) => (
                  <td
                    key={column.role}
                    className="px-3 py-2.5 text-[14px]"
                  >
                    <CompanyRoleCell
                      companies={row.companies}
                      role={column.role}
                    />
                  </td>
                ))}
                <td className="tnum px-3 py-2.5 whitespace-nowrap text-ink-soft">
                  {relative(row.last_changed_at)}
                </td>
                {viewKey && (
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    <ProjectRowActions
                      projectNumber={row.project_number}
                      viewKey={viewKey}
                      lists={lists}
                      hidden={rowHidden}
                    />
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </DataTableFrame>
  );
}
