import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/Badge";
import { getCompany } from "@/lib/data/company";
import { sqft, shortDate, DASH } from "@/lib/format";
import { statusTone } from "@/lib/schedule";

export const dynamic = "force-dynamic";

const ROLE_SHORT: Record<string, string> = {
  owner: "Owner",
  tenant: "Tenant",
  architect: "Architect",
  gc: "GC",
  filer: "Filer",
};

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
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <h2 className="font-mono text-[12px] font-semibold tracking-wide text-ink">
          {title}
        </h2>
        {meta && <span className="label">{meta}</span>}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getCompany(Number(id));
  if (!data) notFound();
  const { company, stat, projects, connections } = data;

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-line bg-paper/85 px-6 pt-5 pb-4 backdrop-blur-sm">
        <Link
          href="/companies"
          className="font-mono text-[11px] text-ink-faint hover:text-blueprint"
        >
          ← Companies
        </Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              {company.canonical_name}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {(stat.roles ?? []).map((r) => (
                <Badge key={r} tone="neutral">
                  {ROLE_SHORT[r] ?? r}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex gap-6 font-mono text-xs text-ink-faint">
            <div>
              <div className="text-lg font-semibold text-ink">
                {stat.project_count.toLocaleString()}
              </div>
              projects
            </div>
            <div>
              <div className="text-lg font-semibold text-ink">
                {stat.active_count.toLocaleString()}
              </div>
              active
            </div>
            <div>
              <div className="text-lg font-semibold text-ink">
                {(stat.cities ?? []).length}
              </div>
              markets
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-4 p-6 lg:grid-cols-[1fr_320px]">
        {/* Main */}
        <div className="flex flex-col gap-4">
          <Section
            title="PROJECT HISTORY"
            meta={`${projects.length}${projects.length === 200 ? "+" : ""} shown`}
          >
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="label border-b border-line text-left">
                    <th className="px-2 py-1.5 font-medium">Project</th>
                    <th className="px-2 py-1.5 font-medium">Role</th>
                    <th className="px-2 py-1.5 font-medium">City</th>
                    <th className="px-2 py-1.5 font-medium">Status</th>
                    <th className="px-2 py-1.5 text-right font-medium">Sq Ft</th>
                    <th className="px-2 py-1.5 font-medium">Filed</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p) => (
                    <tr
                      key={p.project_number + p.role}
                      className="group border-b border-line/60 hover:bg-surface-2"
                    >
                      <td className="px-2 py-2">
                        <Link
                          href={`/projects/${p.project_number}`}
                          className="text-ink group-hover:text-blueprint"
                        >
                          {p.project_name || p.facility_name || p.project_number}
                        </Link>
                      </td>
                      <td className="px-2 py-2 text-ink-soft">
                        {ROLE_SHORT[p.role] ?? p.role}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-ink-soft">
                        {p.location_city
                          ? `${p.location_city}, ${p.location_state ?? ""}`
                          : DASH}
                      </td>
                      <td className="px-2 py-2">
                        <Badge tone={statusTone(p.current_status)}>
                          {p.current_status ?? DASH}
                        </Badge>
                      </td>
                      <td className="tnum px-2 py-2 text-right text-ink">
                        {sqft(p.square_footage)}
                      </td>
                      <td className="tnum px-2 py-2 whitespace-nowrap text-ink-faint">
                        {shortDate(p.registration_date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="CONNECTED COMPANIES" meta="shared projects">
            {connections.length ? (
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="label border-b border-line text-left">
                    <th className="px-2 py-1.5 font-medium">Company</th>
                    <th className="px-2 py-1.5 font-medium">Relationship</th>
                    <th className="px-2 py-1.5 text-right font-medium">Shared</th>
                  </tr>
                </thead>
                <tbody>
                  {connections.map((c) => (
                    <tr
                      key={c.company_id + c.role}
                      className="group border-b border-line/60 hover:bg-surface-2"
                    >
                      <td className="px-2 py-2">
                        <Link
                          href={`/companies/${c.company_id}`}
                          className="text-ink group-hover:text-blueprint"
                        >
                          {c.canonical_name}
                        </Link>
                      </td>
                      <td className="px-2 py-2 text-ink-soft">
                        {ROLE_SHORT[c.role] ?? c.role} on shared projects
                      </td>
                      <td className="tnum px-2 py-2 text-right text-ink">
                        {c.shared}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-[12px] text-ink-faint">
                No companies share a project with this one yet.
              </p>
            )}
          </Section>
        </div>

        {/* Right rail */}
        <div className="flex flex-col gap-4">
          <Section title="IDENTITY">
            <div className="flex flex-col gap-3">
              <div>
                <div className="label mb-1">Phone</div>
                <div className="font-mono text-[13px] text-ink">
                  {company.phone ?? DASH}
                </div>
              </div>
              <div>
                <div className="label mb-1">Address</div>
                <div className="text-[13px] text-ink-soft">
                  {company.address ?? DASH}
                </div>
              </div>
              {company.name_variants.length > 1 && (
                <div>
                  <div className="label mb-1">
                    Also filed as ({company.name_variants.length})
                  </div>
                  <div className="flex flex-col gap-0.5 font-mono text-[11px] text-ink-faint">
                    {company.name_variants.slice(0, 8).map((v) => (
                      <span key={v}>{v}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Section>

          <Section title="MARKETS">
            <div className="flex flex-wrap gap-1.5">
              {(stat.cities ?? []).length ? (
                (stat.cities ?? []).slice(0, 18).map((c) => (
                  <span
                    key={c}
                    className="rounded-[var(--radius)] border border-line bg-paper px-1.5 py-0.5 font-mono text-[11px] text-ink-soft"
                  >
                    {c}
                  </span>
                ))
              ) : (
                <span className="text-[12px] text-ink-faint">{DASH}</span>
              )}
            </div>
          </Section>

          <Section title="TEAM NOTES">
            <p className="text-[12px] text-ink-faint">
              No notes yet. Team notes with @mentions arrive next.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
