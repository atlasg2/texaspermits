import { admin } from "@/lib/supabase/admin";
import {
  attachCompanies,
  cleanProjectSearchTerm,
  companyProjectNumbersForSearch,
  type ProjectRow,
} from "@/lib/data/projects";
import { deriveSchedule, type ScheduleState } from "@/lib/schedule";

export const VIEW_PAGE = 50;

// Views are intents, not statuses. Lifecycle status (active/behind/complete…)
// is a filter *inside* the Gym Projects view, not its own view.
export type ViewKey = "new_changed" | "prospects" | "gym";

export const VIEWS: {
  key: ViewKey;
  label: string;
  blurb: string;
  caveat?: string;
}[] = [
  {
    key: "new_changed",
    label: "New & Changed",
    blurb:
      "Fitness projects filed or updated in the last 120 days — your daily lead feed.",
  },
  {
    key: "prospects",
    label: "Prospects",
    blurb:
      "Early-stage fitness projects (registered or approved, not yet started) at least 10,000 sq ft — reach the owner or architect before flooring is bid.",
  },
  {
    key: "gym",
    label: "Gym Projects",
    blurb:
      "Every fitness project we track. Filter by stage: registered, approved, active, behind, or complete.",
    caveat:
      "TABS status and dates are filer-reported and can lag the jobsite. Treat stage as the record, not a site confirmation.",
  },
];

// The non-overlapping lifecycle buckets used by the Gym Projects stage filter.
export type Stage = Exclude<ScheduleState, "unknown">;
export const STAGE_FILTERS: { key: Stage; label: string }[] = [
  { key: "registered", label: "Registered" },
  { key: "approved", label: "Approved" },
  { key: "active", label: "Active" },
  { key: "behind", label: "Behind" },
  { key: "complete", label: "Complete" },
];

type Raw = Omit<ProjectRow, "companies">;

function stageOf(r: Raw): ScheduleState {
  return deriveSchedule(r.current_status, r.start_date, r.completion_date);
}

const SORT_COLUMNS: Record<string, keyof Raw> = {
  changed: "last_changed_at",
  filed: "registration_date",
  completion: "completion_date",
  start: "start_date",
  cost: "estimated_cost",
  sqft: "square_footage",
};

async function eliteWorkspaceId(): Promise<number | null> {
  const { data } = await admin
    .from("workspaces")
    .select("id")
    .eq("slug", "elite")
    .maybeSingle();
  return data?.id ?? null;
}

async function hiddenStatuses(
  workspaceId: number,
  view: ViewKey,
): Promise<Map<string, string | null>> {
  const { data, error } = await admin
    .from("project_view_state")
    .select("project_number, status_at_hidden")
    .eq("workspace_id", workspaceId)
    .eq("view_key", view);
  if (error) throw error;
  return new Map(
    (data ?? []).map((row) => [row.project_number, row.status_at_hidden]),
  );
}

// All lens-matched (fitness) projects for the workspace — small enough to
// filter/sort/paginate in memory, then attach companies for the visible page.
async function matchedProjects(): Promise<Raw[]> {
  const wsid = await eliteWorkspaceId();
  if (!wsid) return [];
  const { data } = await admin
    .from("workspace_matches")
    .select(
      "projects(project_number, project_name, facility_name, location_city, location_state, " +
        "current_status, type_of_work, square_footage, estimated_cost, scope_of_work, " +
        "start_date, completion_date, registration_date, last_changed_at)",
    )
    .eq("workspace_id", wsid)
    .limit(5000);
  return ((data ?? []) as unknown as Array<{ projects: Raw | Raw[] }>)
    .map((r) => (Array.isArray(r.projects) ? r.projects[0] : r.projects))
    .filter(Boolean) as Raw[];
}

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
}

function applyView(rows: Raw[], view: ViewKey): Raw[] {
  switch (view) {
    case "new_changed": {
      const cut = isoDaysAgo(120);
      return rows.filter((r) => (r.registration_date ?? "") >= cut);
    }
    case "prospects":
      return rows.filter((r) => {
        const s = stageOf(r);
        return (
          (s === "registered" || s === "approved") &&
          (r.square_footage ?? 0) >= 10_000
        );
      });
    case "gym":
      return rows;
  }
}

function sortRows(rows: Raw[], sort: string): Raw[] {
  const field = SORT_COLUMNS[sort] ?? "registration_date";
  return [...rows].sort((a, b) => {
    const av = a[field];
    const bv = b[field];
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === "number" && typeof bv === "number") return bv - av;
    return String(bv).localeCompare(String(av));
  });
}

function matchesSearch(
  row: Raw,
  term: string,
  companyProjectNumbers: Set<string>,
): boolean {
  const haystack = [
    row.project_number,
    row.project_name,
    row.facility_name,
    row.location_city,
    row.location_state,
    row.scope_of_work,
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase();
  return (
    haystack.includes(term.toLocaleLowerCase()) ||
    companyProjectNumbers.has(row.project_number)
  );
}

export async function getViewCounts(): Promise<Record<ViewKey, number>> {
  const rows = await matchedProjects();
  return {
    new_changed: applyView(rows, "new_changed").length,
    prospects: applyView(rows, "prospects").length,
    gym: applyView(rows, "gym").length,
  };
}

export async function getView(opts: {
  view: ViewKey;
  page?: number;
  q?: string;
  minSqft?: number;
  maxSqft?: number;
  includeHidden?: boolean;
  sort?: string;
  stage?: string;
}) {
  const page = Math.max(1, opts.page ?? 1);
  const from = (page - 1) * VIEW_PAGE;
  const sort = opts.sort ?? "filed";
  const workspaceId = await eliteWorkspaceId();
  const hidden = workspaceId
    ? await hiddenStatuses(workspaceId, opts.view)
    : new Map<string, string | null>();

  let rows = applyView(await matchedProjects(), opts.view);

  // Gym Projects: optional non-overlapping stage filter.
  if (opts.view === "gym" && opts.stage) {
    rows = rows.filter((row) => stageOf(row) === opts.stage);
  }

  if (!opts.includeHidden) {
    rows = rows.filter(
      (row) => hidden.get(row.project_number) !== row.current_status,
    );
  }

  if (opts.q) {
    const term = cleanProjectSearchTerm(opts.q);
    if (term) {
      const companyProjectNumbers = new Set(
        await companyProjectNumbersForSearch(term),
      );
      rows = rows.filter((row) =>
        matchesSearch(row, term, companyProjectNumbers),
      );
    }
  }

  if (opts.minSqft != null) {
    rows = rows.filter(
      (row) =>
        row.square_footage != null && row.square_footage >= opts.minSqft!,
    );
  }
  if (opts.maxSqft != null) {
    rows = rows.filter(
      (row) =>
        row.square_footage != null && row.square_footage <= opts.maxSqft!,
    );
  }
  rows = sortRows(rows, sort);

  const total = rows.length;
  const slice = rows.slice(from, from + VIEW_PAGE);
  const withCompanies = await attachCompanies(slice);
  return {
    rows: withCompanies,
    total,
    page,
    hiddenProjectNumbers: slice
      .filter((row) => hidden.get(row.project_number) === row.current_status)
      .map((row) => row.project_number),
  };
}
