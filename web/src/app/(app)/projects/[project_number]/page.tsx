import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/Badge";
import { getProject, type ChangeRow, type Connection } from "@/lib/data/project";
import { money, sqft, shortDate, relative, DASH } from "@/lib/format";
import { deriveSchedule, SCHEDULE_META, statusTone } from "@/lib/schedule";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  tenant: "Tenant / Operator",
  architect: "Architect",
  owner: "Owner",
  gc: "General Contractor",
  filer: "Filer",
};
const ROLE_RANK = ["tenant", "architect", "owner", "gc", "filer"];

function changeLabel(c: ChangeRow): string {
  if (c.kind === "new_project") return "Project first found in TABS";
  if (c.kind === "status")
    return `Status set to ${c.new_value ?? DASH}${
      c.old_value ? ` (was ${c.old_value})` : ""
    }`;
  const f = (c.field ?? c.kind).replace(/_/g, " ");
  return `${f} changed: ${c.old_value ?? DASH} → ${c.new_value ?? DASH}`;
}

function Field({
  label,
  children,
  wide = false,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <div className="label mb-1">{label}</div>
      <div className="text-[13.5px] text-ink">{children}</div>
    </div>
  );
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

function ConnectionCard({ c }: { c: Connection }) {
  return (
    <Link
      href={`/companies/${c.id}`}
      className="block rounded-[var(--radius)] border border-line bg-paper px-3 py-2 transition-colors hover:border-blueprint hover:bg-blueprint-wash"
    >
      <div className="font-medium text-ink">{c.name}</div>
      <div className="mt-0.5 flex flex-wrap gap-x-3 font-mono text-[11px] text-ink-faint">
        {c.phone && <span>{c.phone}</span>}
        {c.address && <span className="truncate">{c.address}</span>}
      </div>
    </Link>
  );
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ project_number: string }>;
}) {
  const { project_number } = await params;
  const data = await getProject(project_number);
  if (!data) notFound();
  const { project: p, connections, changes } = data;

  const sched = deriveSchedule(p.current_status, p.start_date, p.completion_date);
  const meta = SCHEDULE_META[sched];
  const title = p.project_name || p.facility_name || p.project_number;
  const printUrl = `https://www.tdlr.texas.gov/TABS/Search/Print/${p.project_number}`;

  const byRole = (role: string) => connections.filter((c) => c.role === role);
  const rolesPresent = ROLE_RANK.filter((r) => byRole(r).length);

  return (
    <div className="min-h-dvh">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-line bg-paper/85 px-6 pt-5 pb-4 backdrop-blur-sm">
        <Link
          href="/projects"
          className="font-mono text-[11px] text-ink-faint hover:text-blueprint"
        >
          ← Projects
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              {title}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] text-ink-faint">
                {p.project_number}
              </span>
              <span className="text-ink-faint">·</span>
              <span className="text-[13px] text-ink-soft">
                {p.location_city
                  ? `${p.location_city}, ${p.location_state ?? ""}`
                  : DASH}
              </span>
              <Badge tone={statusTone(p.current_status)}>
                {p.current_status ?? DASH}
              </Badge>
              <Badge tone={meta.tone} dot>
                {meta.label}
              </Badge>
            </div>
          </div>
          <a
            href={printUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-[var(--radius)] border border-line-strong bg-surface px-3 py-1.5 font-mono text-[11px] text-ink-soft hover:border-blueprint hover:text-blueprint"
          >
            TABS source ↗
          </a>
        </div>
      </header>

      <div className="grid gap-4 p-6 lg:grid-cols-[1fr_340px]">
        {/* Main column */}
        <div className="flex flex-col gap-4">
          <Section title="OVERVIEW" meta={`Last checked ${relative(p.last_seen_at)}`}>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Field label="Type of work">{p.type_of_work ?? DASH}</Field>
              <Field label="Type of funds">{p.type_of_funds ?? DASH}</Field>
              <Field label="Square footage">
                <span className="tnum">{sqft(p.square_footage)}</span>
              </Field>
              <Field label="Estimated cost">
                <span className="tnum">{money(p.estimated_cost)}</span>
                <span className="ml-1.5 text-[11px] text-ink-faint">
                  filer estimate
                </span>
              </Field>
              <Field label="Start date">
                <span className="tnum">{shortDate(p.start_date)}</span>
              </Field>
              <Field label="Completion date">
                <span className="tnum">{shortDate(p.completion_date)}</span>
              </Field>
              <Field label="Registered">
                <span className="tnum">{shortDate(p.registration_date)}</span>
              </Field>
              <Field label="County">{p.location_county ?? DASH}</Field>
              <Field label="Address" wide>
                {p.location_full ?? DASH}
              </Field>
              <Field label="Scope of work" wide>
                <p className="leading-relaxed whitespace-pre-wrap text-ink-soft">
                  {p.scope_of_work ?? DASH}
                </p>
              </Field>
            </div>
          </Section>

          <Section title="CHANGES" meta={`${changes.length} events`}>
            <ol className="relative ml-1 border-l border-line">
              {changes.map((c, i) => (
                <li key={i} className="relative mb-4 pl-5 last:mb-0">
                  <span
                    className={`absolute top-1 -left-[5px] size-2.5 rounded-full border-2 border-surface ${
                      c.kind === "new_project" ? "bg-blueprint" : "bg-grass"
                    }`}
                  />
                  <div className="tnum text-[11px] text-ink-faint">
                    {shortDate(c.changed_at.slice(0, 10))}
                  </div>
                  <div className="text-[13px] text-ink">{changeLabel(c)}</div>
                </li>
              ))}
            </ol>
            <p className="mt-3 border-t border-line pt-3 font-mono text-[10.5px] leading-relaxed text-ink-faint">
              History begins when we first observed the project. Field-level
              changes accrue daily from here.
            </p>
          </Section>
        </div>

        {/* Right rail */}
        <div className="flex flex-col gap-4">
          <Section title="CONNECTIONS">
            <div className="flex flex-col gap-3">
              {rolesPresent.map((role) => (
                <div key={role}>
                  <div className="label mb-1.5">{ROLE_LABEL[role]}</div>
                  <div className="flex flex-col gap-1.5">
                    {byRole(role).map((c) => (
                      <ConnectionCard key={c.id + role} c={c} />
                    ))}
                  </div>
                </div>
              ))}

              {/* GC is never in TABS — show it as an explicit unknown. */}
              <div>
                <div className="label mb-1.5">General Contractor</div>
                <div className="rounded-[var(--radius)] border border-dashed border-line-strong bg-paper px-3 py-2 text-[12px] text-ink-faint">
                  Unknown — not in the public record
                </div>
              </div>

              {p.filer_contact_name && (
                <div>
                  <div className="label mb-1.5">Filer</div>
                  <div className="rounded-[var(--radius)] border border-line bg-paper px-3 py-2 text-[13px] text-ink-soft">
                    {p.filer_contact_name}
                  </div>
                </div>
              )}
            </div>
          </Section>

          <Section title="LISTS">
            <p className="text-[12px] text-ink-faint">
              Not on any list yet. Watchlist & Follow-Up actions arrive with the
              Lists tab.
            </p>
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
