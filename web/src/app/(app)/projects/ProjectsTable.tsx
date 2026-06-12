import Link from "next/link";
import { Badge } from "@/components/Badge";
import { money, sqft, shortDate, relative, firstLine, DASH } from "@/lib/format";
import { deriveSchedule, SCHEDULE_META, statusTone } from "@/lib/schedule";
import type { ProjectRow, CompanyRef } from "@/lib/data/projects";

const WORK_SHORT: Record<string, string> = {
  "Renovation/Alteration": "Reno",
  "New Construction": "New",
  "Additions to Existing Building": "Add",
};

const ROLE_GLYPH: Record<string, string> = {
  owner: "O",
  tenant: "T",
  architect: "A",
  gc: "G",
  filer: "F",
};
const ROLE_ORDER = ["tenant", "architect", "owner"];

function CompaniesCell({ companies }: { companies: CompanyRef[] }) {
  if (!companies.length) return <span className="text-ink-faint">{DASH}</span>;
  const seen = new Set<string>();
  const picks: CompanyRef[] = [];
  for (const role of ROLE_ORDER) {
    const c = companies.find((x) => x.role === role && !seen.has(role));
    if (c) {
      seen.add(role);
      picks.push(c);
    }
    if (picks.length === 2) break;
  }
  return (
    <div className="flex flex-col gap-0.5">
      {picks.map((c) => (
        <Link
          key={c.role + c.id}
          href={`/companies/${c.id}`}
          className="flex items-center gap-1.5 text-ink-soft hover:text-blueprint"
        >
          <span className="font-mono text-[9px] text-ink-faint">
            {ROLE_GLYPH[c.role] ?? "·"}
          </span>
          <span className="max-w-[150px] truncate">{c.name}</span>
        </Link>
      ))}
    </div>
  );
}

function SortHead({
  col,
  label,
  align,
  activeSort,
  params,
}: {
  col: string;
  label: string;
  align?: string;
  activeSort: string;
  params: Record<string, string>;
}) {
  const next = new URLSearchParams(params);
  next.set("sort", col);
  next.delete("page");
  const active = activeSort === col;
  return (
    <th className={`px-3 py-2 font-medium ${align ?? "text-left"}`}>
      <Link
        href={`/projects?${next.toString()}`}
        className={`inline-flex items-center gap-1 hover:text-ink ${
          active ? "text-ink" : ""
        }`}
      >
        {label}
        <span className={active ? "text-blueprint" : "text-transparent"}>▾</span>
      </Link>
    </th>
  );
}

export function ProjectsTable({
  rows,
  activeSort,
  params,
}: {
  rows: ProjectRow[];
  activeSort: string;
  params: Record<string, string>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="label border-b border-line-strong text-left">
            <th className="px-3 py-2 font-medium">Project</th>
            <th className="px-3 py-2 font-medium">City</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Schedule</th>
            <th className="px-3 py-2 font-medium">Type</th>
            <SortHead col="sqft" label="Sq Ft" align="text-right" activeSort={activeSort} params={params} />
            <SortHead col="cost" label="Est. Cost" align="text-right" activeSort={activeSort} params={params} />
            <SortHead col="completion" label="Completion" activeSort={activeSort} params={params} />
            <th className="px-3 py-2 font-medium">Companies</th>
            <SortHead col="changed" label="Changed" activeSort={activeSort} params={params} />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const sched = deriveSchedule(
              r.current_status,
              r.start_date,
              r.completion_date,
            );
            const meta = SCHEDULE_META[sched];
            const title = r.project_name || r.facility_name || r.project_number;
            return (
              <tr
                key={r.project_number}
                className="group border-b border-line align-top transition-colors hover:bg-surface-2"
              >
                <td className="px-3 py-2.5">
                  <Link href={`/projects/${r.project_number}`} className="block">
                    <div className="font-medium text-ink group-hover:text-blueprint">
                      {title}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="font-mono text-[10px] text-ink-faint">
                        {r.project_number}
                      </span>
                      <span className="truncate text-[11px] text-ink-faint">
                        {firstLine(r.scope_of_work, 52)}
                      </span>
                    </div>
                  </Link>
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap text-ink-soft">
                  {r.location_city
                    ? `${r.location_city}${r.location_state ? ", " + r.location_state : ""}`
                    : DASH}
                </td>
                <td className="px-3 py-2.5">
                  <Badge tone={statusTone(r.current_status)}>
                    {r.current_status ?? DASH}
                  </Badge>
                </td>
                <td className="px-3 py-2.5">
                  <Badge tone={meta.tone} dot>
                    {meta.label}
                  </Badge>
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap text-ink-soft">
                  {r.type_of_work ? (WORK_SHORT[r.type_of_work] ?? r.type_of_work) : DASH}
                </td>
                <td className="tnum px-3 py-2.5 text-right text-ink">
                  {sqft(r.square_footage)}
                </td>
                <td className="tnum px-3 py-2.5 text-right text-ink" title="Filer's self-reported estimate — unreliable">
                  {money(r.estimated_cost)}
                </td>
                <td className="tnum px-3 py-2.5 whitespace-nowrap text-ink-soft">
                  {shortDate(r.completion_date)}
                </td>
                <td className="px-3 py-2.5 text-[12px]">
                  <CompaniesCell companies={r.companies} />
                </td>
                <td className="tnum px-3 py-2.5 whitespace-nowrap text-ink-faint">
                  {relative(r.last_changed_at)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!rows.length && (
        <div className="blueprint-grid grid place-items-center py-24 text-center">
          <div>
            <div className="label mb-1">No matches</div>
            <p className="text-sm text-ink-soft">
              Try a different search or clear the filters.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
