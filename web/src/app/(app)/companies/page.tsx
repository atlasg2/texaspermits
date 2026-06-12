import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/Badge";
import { Pagination } from "@/components/Pagination";
import {
  getCompanies,
  COMPANIES_PAGE,
  type CompanyRoleTab,
} from "@/lib/data/companies";
import { CompaniesToolbar } from "./CompaniesToolbar";
import { DASH } from "@/lib/format";
import type { Tone } from "@/lib/schedule";

export const dynamic = "force-dynamic";

const ROLE_TONE: Record<string, Tone> = {
  owner: "slate",
  tenant: "blueprint",
  architect: "grass",
  gc: "amber",
  filer: "neutral",
};
const ROLE_SHORT: Record<string, string> = {
  owner: "Owner",
  tenant: "Tenant",
  architect: "Architect",
  gc: "GC",
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
  const role = (one(sp.role) ?? "all") as CompanyRoleTab;
  const page = Number(one(sp.page) ?? "1") || 1;

  const { rows, total } = await getCompanies({
    role,
    q: one(sp.q),
    sort: one(sp.sort),
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
        eyebrow="Owners · Tenants · Architects · GCs"
        title="Companies"
        count={`${total.toLocaleString()} companies`}
      >
        <CompaniesToolbar activeRole={role} />
      </PageHeader>

      <div className="flex-1 px-3 py-2">
        {role === "gc" ? (
          <div className="blueprint-grid grid place-items-center py-24 text-center">
            <div className="max-w-sm">
              <div className="label mb-1">No general contractors yet</div>
              <p className="text-sm text-ink-soft">
                TABS never names the GC. This fills in once permit-based GC
                discovery is added — a later phase.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="label border-b border-line-strong text-left">
                  <th className="px-3 py-2 font-medium">Company</th>
                  <th className="px-3 py-2 font-medium">Roles</th>
                  <th className="px-3 py-2 text-right font-medium">Projects</th>
                  <th className="px-3 py-2 text-right font-medium">Active</th>
                  <th className="px-3 py-2 font-medium">Markets</th>
                  <th className="px-3 py-2 font-medium">Recent</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr
                    key={c.company_id}
                    className="group border-b border-line align-top transition-colors hover:bg-surface-2"
                  >
                    <td className="px-3 py-2.5">
                      <Link
                        href={`/companies/${c.company_id}`}
                        className="font-medium text-ink group-hover:text-blueprint"
                      >
                        {c.canonical_name}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {c.roles.map((r) => (
                          <Badge key={r} tone={ROLE_TONE[r] ?? "neutral"}>
                            {ROLE_SHORT[r] ?? r}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="tnum px-3 py-2.5 text-right text-ink">
                      {c.project_count.toLocaleString()}
                    </td>
                    <td className="tnum px-3 py-2.5 text-right text-ink-soft">
                      {c.active_count.toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 text-ink-soft">
                      {c.cities && c.cities.length
                        ? c.cities.slice(0, 3).join(", ") +
                          (c.cities.length > 3 ? ` +${c.cities.length - 3}` : "")
                        : DASH}
                    </td>
                    <td className="px-3 py-2.5 text-[12px] text-ink-faint">
                      {c.recent.length ? (
                        <span className="line-clamp-1">
                          {c.recent.join(" · ")}
                        </span>
                      ) : (
                        DASH
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length && (
              <div className="blueprint-grid grid place-items-center py-24 text-center">
                <div>
                  <div className="label mb-1">No matches</div>
                  <p className="text-sm text-ink-soft">
                    Try a different search or sub-tab.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {role !== "gc" && (
        <Pagination
          page={page}
          pages={pages}
          total={total}
          pageSize={COMPANIES_PAGE}
          hrefFor={hrefFor}
          unit="companies"
        />
      )}
    </div>
  );
}
