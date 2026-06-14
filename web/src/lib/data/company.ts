import { unstable_cache } from "next/cache";
import { admin } from "@/lib/supabase/admin";
import {
  type ProjectQuery,
  type ProjectRow,
} from "@/lib/data/projects";

export const COMPANY_PROJECTS_PAGE = 50;

export type CompanyIdentity = {
  id: number;
  canonical_name: string;
  name_variants: string[];
  kind: string;
  phone: string | null;
  address: string | null;
};

export type CompanySummaryStat = {
  project_count: number;
  open_count: number;
  behind_count: number;
  recent_90d_count: number;
  largest_project_sqft: number | null;
  cities: string[] | null;
  roles: string[];
  last_filed: string | null;
};

export type CompanyConnection = {
  company_id: number;
  canonical_name: string;
  role: string;
  shared: number;
};

type CompanyProjectRow = ProjectRow & {
  total_count: number;
};

const getCompanySummaryCached = unstable_cache(
  async (id: number) => {
    const [companyResult, statResult] = await Promise.all([
      admin
        .from("companies")
        .select("id, canonical_name, name_variants, kind, phone, address")
        .eq("id", id)
        .maybeSingle(),
      admin
        .from("company_stats")
        .select(
          "project_count, open_count, behind_count, recent_90d_count, " +
            "largest_project_sqft, cities, roles, last_filed",
        )
        .eq("company_id", id)
        .maybeSingle(),
    ]);

    if (!companyResult.data) return null;

    return {
      company: companyResult.data as CompanyIdentity,
      stat: (statResult.data ?? {
        project_count: 0,
        open_count: 0,
        behind_count: 0,
        recent_90d_count: 0,
        largest_project_sqft: null,
        cities: [],
        roles: [],
        last_filed: null,
      }) as CompanySummaryStat,
    };
  },
  ["company-summary-v2"],
  { revalidate: 300, tags: ["companies"] },
);

const getCompanyConnectionsCached = unstable_cache(
  async (id: number) => {
    const { data, error } = await admin.rpc("company_connections", { cid: id });
    if (error) throw error;
    return (data ?? []) as CompanyConnection[];
  },
  ["company-connections-v1"],
  { revalidate: 300, tags: ["company-connections"] },
);

export async function getCompanySummary(id: number) {
  return getCompanySummaryCached(id);
}

export async function getCompanyConnections(id: number) {
  return getCompanyConnectionsCached(id);
}

export async function getCompanyProjects(
  id: number,
  query: ProjectQuery,
) {
  const page = Math.max(1, query.page ?? 1);
  const minimumSqft: Record<string, number> = {
    "min-10000": 10_000,
    "min-25000": 25_000,
    "min-50000": 50_000,
    "min-100000": 100_000,
  };

  const { data, error } = await admin.rpc("company_project_rows", {
    p_company_id: id,
    p_search: query.q || null,
    p_stage: query.stage || "all",
    p_timing: query.timing || null,
    p_work: query.work || null,
    p_min_sqft: query.sqft ? minimumSqft[query.sqft] ?? null : null,
    p_sort: query.sort || "changed",
    p_offset: (page - 1) * COMPANY_PROJECTS_PAGE,
    p_limit: COMPANY_PROJECTS_PAGE,
  });
  if (error) throw error;

  const raw = (data ?? []) as unknown as CompanyProjectRow[];
  const total = raw.length ? Number(raw[0].total_count) : 0;
  const rows: ProjectRow[] = raw.map((row) => ({
    project_number: row.project_number,
    project_name: row.project_name,
    facility_name: row.facility_name,
    location_city: row.location_city,
    location_state: row.location_state,
    current_status: row.current_status,
    type_of_work: row.type_of_work,
    square_footage: row.square_footage,
    estimated_cost: row.estimated_cost,
    scope_of_work: row.scope_of_work,
    start_date: row.start_date,
    completion_date: row.completion_date,
    registration_date: row.registration_date,
    last_changed_at: row.last_changed_at,
    companies: row.companies ?? [],
  }));

  return { rows, total, page };
}
