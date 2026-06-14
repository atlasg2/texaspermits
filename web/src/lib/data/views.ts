import { admin } from "@/lib/supabase/admin";
import {
  attachCompanies,
  cleanProjectSearchTerm,
  companyProjectNumbersForSearch,
  type ProjectRow,
} from "@/lib/data/projects";
import { deriveSchedule, isTerminal } from "@/lib/schedule";

export const VIEW_PAGE = 50;

export type ViewKey =
  | "registered_10k"
  | "new_changed"
  | "active"
  | "recently_completed"
  | "possibly_late";

export const VIEWS: {
  key: ViewKey;
  label: string;
  blurb: string;
  caveat?: string;
  allProjects?: boolean;
}[] = [
  {
    key: "registered_10k",
    label: "Registered Projects · 10k+ · Not Stale",
    blurb:
      "All Texas projects still awaiting TABS review, at least 10,000 sqft, with no passed completion estimate.",
    allProjects: true,
  },
  {
    key: "new_changed",
    label: "New / Changed Gym Projects",
    blurb: "Fitness projects filed or updated in the last 120 days.",
  },
  {
    key: "active",
    label: "Active Gym Projects",
    blurb: "Fitness projects not yet closed — in design or construction.",
  },
  {
    key: "recently_completed",
    label: "Recently Completed Gym Projects",
    blurb: "Fitness projects whose status moved to closed.",
    caveat:
      "Source status can lag the jobsite. A closed status is the record, not a site confirmation.",
  },
  {
    key: "possibly_late",
    label: "Behind Gym Projects",
    blurb: "Estimated completion has passed but the project isn't complete.",
    caveat:
      "TABS dates are filer estimates and status may lag the jobsite. Behind means the record needs attention, not that delay is confirmed.",
  },
];

type Raw = Omit<ProjectRow, "companies">;

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

// All lens-matched projects for the workspace (≈1.8k rows — small enough to
// filter/sort/paginate in memory, then attach companies for the visible page).
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
    case "registered_10k":
      return [];
    case "active":
      return rows.filter((r) => !isTerminal(r.current_status));
    case "new_changed": {
      const cut = isoDaysAgo(120);
      return rows.filter((r) => (r.registration_date ?? "") >= cut);
    }
    case "recently_completed":
      return rows.filter((r) => isTerminal(r.current_status));
    case "possibly_late":
      return rows.filter(
        (r) =>
          deriveSchedule(r.current_status, r.start_date, r.completion_date) ===
          "behind",
      );
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

function registered10kBase() {
  const today = new Date().toISOString().slice(0, 10);
  return admin
    .from("projects")
    .select(
      "project_number, project_name, facility_name, location_city, location_state, " +
        "current_status, type_of_work, square_footage, estimated_cost, scope_of_work, " +
        "start_date, completion_date, registration_date, last_changed_at",
      { count: "exact" },
    )
    .eq("current_status", "Project Registered")
    .gte("square_footage", 10_000)
    .or(`completion_date.is.null,completion_date.gte.${today}`);
}

async function registered10kCount(): Promise<number> {
  const { count, error } = await registered10kBase().limit(0);
  if (error) throw error;
  return count ?? 0;
}

export async function getViewCounts(): Promise<Record<ViewKey, number>> {
  const [rows, registered10k] = await Promise.all([
    matchedProjects(),
    registered10kCount(),
  ]);
  return {
    registered_10k: registered10k,
    new_changed: applyView(rows, "new_changed").length,
    active: applyView(rows, "active").length,
    recently_completed: applyView(rows, "recently_completed").length,
    possibly_late: applyView(rows, "possibly_late").length,
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
}) {
  const page = Math.max(1, opts.page ?? 1);
  const from = (page - 1) * VIEW_PAGE;
  const sort = opts.sort ?? "filed";
  const workspaceId = await eliteWorkspaceId();
  const hidden = workspaceId
    ? await hiddenStatuses(workspaceId, opts.view)
    : new Map<string, string | null>();

  if (opts.view === "registered_10k") {
    let query = registered10kBase();
    if (opts.minSqft != null) {
      query = query.gte("square_footage", opts.minSqft);
    }
    if (opts.maxSqft != null) {
      query = query.lte("square_footage", opts.maxSqft);
    }

    const term = opts.q ? cleanProjectSearchTerm(opts.q) : "";
    if (term) {
      const projectNumbers = await companyProjectNumbersForSearch(term);
      const ors = [
        `project_name.ilike.%${term}%`,
        `facility_name.ilike.%${term}%`,
        `location_city.ilike.%${term}%`,
        `scope_of_work.ilike.%${term}%`,
        `project_number.ilike.%${term}%`,
      ];
      if (projectNumbers.length) {
        ors.push(`project_number.in.(${projectNumbers.join(",")})`);
      }
      query = query.or(ors.join(","));
    }

    if (!opts.includeHidden) {
      const hiddenProjectNumbers = [...hidden.entries()]
        .filter(([, status]) => status === "Project Registered")
        .map(([projectNumber]) => projectNumber);
      if (hiddenProjectNumbers.length) {
        query = query.not(
          "project_number",
          "in",
          `(${hiddenProjectNumbers.join(",")})`,
        );
      }
    }

    const { data, count, error } = await query
      .order(SORT_COLUMNS[sort] ?? "registration_date", {
        ascending: false,
        nullsFirst: false,
      })
      .order("project_number", { ascending: false })
      .range(from, from + VIEW_PAGE - 1);
    if (error) throw error;

    const rows = await attachCompanies(
      (data ?? []) as unknown as Omit<ProjectRow, "companies">[],
    );
    return {
      rows,
      total: count ?? 0,
      page,
      hiddenProjectNumbers: rows
        .filter(
          (row) => hidden.get(row.project_number) === row.current_status,
        )
        .map((row) => row.project_number),
    };
  }

  let rows = applyView(await matchedProjects(), opts.view);

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
