import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/Badge";
import { getProject, type ChangeRow, type Connection } from "@/lib/data/project";
import { money, sqft, shortDate, relative, DASH } from "@/lib/format";
import {
  isBehindEstimate,
  isStaleRegistration,
  statusLabel,
  statusTone,
} from "@/lib/schedule";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

const ROLE_LABEL: Record<string, string> = {
  tenant: "Tenant / Operator",
  architect: "Architect",
  owner: "Owner",
};
const ROLE_ORDER = ["tenant", "architect", "owner"];

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function changeLabel(change: ChangeRow): string {
  if (change.kind === "new_project") return "Project first found in TABS";
  if (change.kind === "status") {
    return `Status set to ${change.new_value ?? DASH}${
      change.old_value ? ` (was ${change.old_value})` : ""
    }`;
  }
  const field = (change.field ?? change.kind).replace(/_/g, " ");
  return `${field} changed: ${change.old_value ?? DASH} → ${
    change.new_value ?? DASH
  }`;
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
    <div className={wide ? "sm:col-span-2" : ""}>
      <div className="label mb-1">{label}</div>
      <div className="text-[15.5px] text-ink">{children}</div>
    </div>
  );
}

function ConnectionCard({ connection }: { connection: Connection }) {
  return (
    <Link
      href={`/companies/${connection.id}?companyRole=${connection.role}`}
      className="block rounded-[var(--radius)] border border-line bg-paper px-3 py-3 transition-colors hover:border-blueprint hover:bg-blueprint-wash"
    >
      <div className="font-medium text-ink">{connection.name}</div>
      <div className="mt-1 flex flex-col gap-0.5 font-mono text-[13px] text-ink-soft">
        {connection.phone && <span>{connection.phone}</span>}
        {connection.address && <span>{connection.address}</span>}
      </div>
    </Link>
  );
}

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ project_number: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ project_number }, sp] = await Promise.all([params, searchParams]);
  const data = await getProject(project_number);
  if (!data) notFound();
  const { project, connections, changes } = data;

  const title =
    project.project_name || project.facility_name || project.project_number;
  const sourceUrl = `https://www.tdlr.texas.gov/TABS/Search/Print/${project.project_number}`;
  const staleRegistration = isStaleRegistration(
    project.current_status,
    project.completion_date,
  );
  const behindEstimate = isBehindEstimate(
    project.current_status,
    project.completion_date,
  );
  const requestedReturn = one(sp.from);
  const returnPath =
    requestedReturn?.startsWith("/companies/") ? requestedReturn : "/projects";
  const returnLabel =
    returnPath === "/projects"
      ? "Projects"
      : one(sp.fromLabel) || "Company projects";
  const connectionsByRole = (role: string) =>
    connections.filter((connection) => connection.role === role);

  return (
    <div className="min-h-dvh">
      <header className="z-20 border-b border-line bg-paper/90 px-6 pt-5 pb-4 backdrop-blur-sm md:sticky md:top-0">
        <div className="flex flex-wrap items-center gap-2 font-mono text-[13px] text-ink-soft">
          <Link href={returnPath} className="hover:text-blueprint">
            {returnLabel}
          </Link>
          <span>/</span>
          <span className="text-ink">{title}</span>
        </div>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-semibold tracking-tight text-ink">
              {title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-[15px] text-ink">
                {project.location_city ?? DASH}
              </span>
              <Badge tone={statusTone(project.current_status)} dot>
                {statusLabel(project.current_status)}
              </Badge>
              {staleRegistration && (
                <Badge tone="amber" dot>
                  Stale registration
                </Badge>
              )}
              {behindEstimate && (
                <Badge tone="rust" dot>
                  Behind estimate
                </Badge>
              )}
            </div>
          </div>

          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-[var(--radius)] border border-line-strong bg-surface px-3 py-2 font-mono text-[13px] text-ink hover:border-blueprint hover:text-blueprint"
          >
            TABS source ↗
          </a>
        </div>
      </header>

      <main className="flex flex-col gap-5 p-6">
        <div className="grid border border-line bg-surface sm:grid-cols-2 xl:grid-cols-5">
          {[
            ["Registered", shortDate(project.registration_date)],
            ["Estimated start", shortDate(project.start_date)],
            ["Estimated completion", shortDate(project.completion_date)],
            ["Square footage", sqft(project.square_footage)],
            ["Estimated cost", money(project.estimated_cost)],
          ].map(([label, value]) => (
            <div
              key={label}
              className="border-b border-line p-4 last:border-b-0 sm:border-r xl:border-b-0"
            >
              <div className="label mb-1">{label}</div>
              <div className="tnum text-xl font-semibold text-ink">{value}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Section
            title="OVERVIEW"
            meta={`Last checked ${relative(project.last_seen_at)}`}
          >
            <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
              <Field label="Type of work">
                {project.type_of_work ?? DASH}
              </Field>
              <Field label="Type of funds">
                {project.type_of_funds ?? DASH}
              </Field>
              <Field label="County">{project.location_county ?? DASH}</Field>
              <Field label="Address">{project.location_full ?? DASH}</Field>
              <Field label="Scope of work" wide>
                <p className="max-w-5xl text-[17px] leading-8 whitespace-pre-wrap text-ink">
                  {project.scope_of_work ?? DASH}
                </p>
              </Field>
              {project.filer_contact_name && (
                <Field label="Filed by" wide>
                  {project.filer_contact_name}
                </Field>
              )}
            </div>
          </Section>

          <Section title="PROJECT PEOPLE">
            <div className="flex flex-col gap-4">
              {ROLE_ORDER.map((role) => {
                const roleConnections = connectionsByRole(role);
                return (
                  <div key={role}>
                    <div className="label mb-2">{ROLE_LABEL[role]}</div>
                    <div className="flex flex-col gap-2">
                      {roleConnections.length ? (
                        roleConnections.map((connection) => (
                          <ConnectionCard
                            key={`${connection.id}-${role}`}
                            connection={connection}
                          />
                        ))
                      ) : (
                        <div className="rounded-[var(--radius)] border border-dashed border-line-strong bg-paper px-3 py-3 text-[14px] text-ink-soft">
                          Not listed
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        </div>

        <details className="group rounded-[var(--radius)] border border-line bg-surface">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3">
            <span className="font-mono text-[14px] font-semibold tracking-wide text-ink">
              CHANGE HISTORY
            </span>
            <span className="label">
              {changes.length} events · click to expand
            </span>
          </summary>
          <div className="border-t border-line p-4">
            <ol className="relative ml-1 max-w-4xl border-l border-line">
              {changes.map((change, index) => (
                <li key={index} className="relative mb-5 pl-5 last:mb-0">
                  <span
                    className={`absolute top-1 -left-[5px] size-2.5 rounded-full border-2 border-surface ${
                      change.kind === "new_project"
                        ? "bg-blueprint"
                        : "bg-grass"
                    }`}
                  />
                  <div className="tnum text-[13px] text-ink-soft">
                    {shortDate(change.changed_at.slice(0, 10))}
                  </div>
                  <div className="text-[15px] text-ink">
                    {changeLabel(change)}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </details>

        <div className="grid gap-5 lg:grid-cols-2">
          <Section title="TEAM NOTES">
            <p className="text-[15px] text-ink-soft">
              No notes yet. Team notes and mentions will live here.
            </p>
          </Section>
          <Section title="LISTS">
            <p className="text-[15px] text-ink-soft">
              This project is not on a list yet.
            </p>
          </Section>
        </div>
      </main>
    </div>
  );
}
