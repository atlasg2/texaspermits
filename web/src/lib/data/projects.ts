import { admin } from "@/lib/supabase/admin";

export {
  SQFT_OPTIONS,
  STAGE_OPTIONS,
  TIMING_OPTIONS,
  WORK_OPTIONS,
} from "@/lib/filters";

export const PAGE_SIZE = 50;

export type CompanyRef = { id: number; name: string; role: string };

export type ProjectRow = {
  project_number: string;
  project_name: string | null;
  facility_name: string | null;
  location_city: string | null;
  location_state: string | null;
  current_status: string | null;
  type_of_work: string | null;
  square_footage: number | null;
  estimated_cost: number | null;
  scope_of_work: string | null;
  start_date: string | null;
  completion_date: string | null;
  registration_date: string | null;
  last_changed_at: string | null;
  companies: CompanyRef[];
};

export type ProjectQuery = {
  q?: string;
  stage?: string;
  timing?: string;
  work?: string;
  sqft?: string;
  sort?: string;
  page?: number;
};

const SORT_COLUMNS: Record<string, string> = {
  changed: "last_changed_at",
  filed: "registration_date",
  completion: "completion_date",
  start: "start_date",
  cost: "estimated_cost",
  sqft: "square_footage",
};

// strip characters that would break a PostgREST or() filter expression
export function cleanProjectSearchTerm(s: string): string {
  return s.replace(/[(),]/g, " ").trim();
}

export async function companyProjectNumbersForSearch(
  term: string,
): Promise<string[]> {
  const { data } = await admin
    .from("companies")
    .select("id")
    .ilike("canonical_name", `%${term}%`)
    .limit(50);
  const ids = (data ?? []).map((r) => r.id);
  if (!ids.length) return [];
  const { data: links } = await admin
    .from("project_companies")
    .select("project_number")
    .in("company_id", ids)
    .limit(500);
  return [...new Set((links ?? []).map((r) => r.project_number))];
}

export async function attachCompanies(rows: Omit<ProjectRow, "companies">[]) {
  const pns = rows.map((r) => r.project_number);
  if (!pns.length) return rows.map((r) => ({ ...r, companies: [] }));
  const { data } = await admin
    .from("project_companies")
    .select("project_number, role, companies(id, canonical_name)")
    .in("project_number", pns);

  const byPn = new Map<string, CompanyRef[]>();
  for (const link of data ?? []) {
    // supabase types the embed as array|object; normalize
    const co = Array.isArray(link.companies) ? link.companies[0] : link.companies;
    if (!co) continue;
    const list = byPn.get(link.project_number) ?? [];
    list.push({ id: co.id, name: co.canonical_name, role: link.role });
    byPn.set(link.project_number, list);
  }
  return rows.map((r) => ({
    ...r,
    companies: byPn.get(r.project_number) ?? [],
  }));
}

export async function getProjects(query: ProjectQuery) {
  const page = Math.max(1, query.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;
  const sortCol = SORT_COLUMNS[query.sort ?? "changed"] ?? "last_changed_at";

  let q = admin
    .from("projects")
    .select(
      "project_number, project_name, facility_name, location_city, location_state, " +
        "current_status, type_of_work, square_footage, estimated_cost, scope_of_work, " +
        "start_date, completion_date, registration_date, last_changed_at",
      { count: "exact" },
    );

  if (query.work) q = q.eq("type_of_work", query.work);
  const minimumSqft: Record<string, number> = {
    "min-10000": 10_000,
    "min-25000": 25_000,
    "min-50000": 50_000,
    "min-100000": 100_000,
  };
  if (query.sqft && minimumSqft[query.sqft]) {
    q = q.gte("square_footage", minimumSqft[query.sqft]);
  }

  const today = new Date().toISOString().slice(0, 10);
  if (query.stage === "open") {
    q = q.in("current_status", ["Project Registered", "Review Complete"]);
  } else if (query.stage === "behind") {
    q = q
      .eq("current_status", "Review Complete")
      .lt("completion_date", today);
  } else if (query.stage === "registered") {
    q = q.eq("current_status", "Project Registered");
  } else if (
    query.stage === "review-complete" ||
    query.stage === "approved"
  ) {
    q = q.eq("current_status", "Review Complete");
  } else if (query.stage === "inspection-complete") {
    q = q.eq("current_status", "Inspection Complete");
  } else if (query.stage === "closed") {
    q = q.eq("current_status", "Project Closed");
  } else if (query.stage === "complete") {
    q = q.in("current_status", ["Inspection Complete", "Project Closed"]);
  }

  if (query.timing === "stale-registered") {
    q = q
      .eq("current_status", "Project Registered")
      .lt("completion_date", today);
  } else if (query.timing === "upcoming") {
    q = q.gt("start_date", today);
  } else if (query.timing === "underway") {
    q = q.lte("start_date", today).gte("completion_date", today);
  } else if (query.timing === "past-completion") {
    q = q
      .lt("completion_date", today)
      .in("current_status", ["Project Registered", "Review Complete"]);
  }

  if (query.q) {
    const term = cleanProjectSearchTerm(query.q);
    if (term) {
      const pns = await companyProjectNumbersForSearch(term);
      const ors = [
        `project_name.ilike.%${term}%`,
        `facility_name.ilike.%${term}%`,
        `location_city.ilike.%${term}%`,
        `scope_of_work.ilike.%${term}%`,
        `project_number.ilike.%${term}%`,
      ];
      if (pns.length) ors.push(`project_number.in.(${pns.join(",")})`);
      q = q.or(ors.join(","));
    }
  }

  q = q
    .order(sortCol, { ascending: false, nullsFirst: false })
    .order("project_number", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  const { data, count, error } = await q;
  if (error) throw error;

  const rows = await attachCompanies(
    (data ?? []) as unknown as Omit<ProjectRow, "companies">[],
  );
  return { rows, total: count ?? 0, page };
}
