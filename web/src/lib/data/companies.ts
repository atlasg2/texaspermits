import { admin } from "@/lib/supabase/admin";
import type { CompanyRoleTab } from "@/lib/filters";

export { ROLE_TABS, type CompanyRoleTab } from "@/lib/filters";

export const COMPANIES_PAGE = 50;

export type CompanyStat = {
  company_id: number;
  canonical_name: string;
  kind: string;
  roles: string[];
  project_count: number;
  open_count: number;
  behind_count: number;
  recent_90d_count: number;
  largest_project_sqft: number | null;
  cities: string[] | null;
  markets_text: string | null;
  last_filed: string | null;
};

const SORT_COLUMNS: Record<string, string> = {
  projects: "project_count",
  open: "open_count",
  behind: "behind_count",
  largest: "largest_project_sqft",
  filed: "last_filed",
  name: "canonical_name",
};

export async function getCompanies(opts: {
  role?: CompanyRoleTab;
  q?: string;
  activity?: string;
  recent?: string;
  minProjects?: string;
  minSqft?: string;
  market?: string;
  sort?: string;
  page?: number;
}) {
  const page = Math.max(1, opts.page ?? 1);
  const from = (page - 1) * COMPANIES_PAGE;
  const sortCol = SORT_COLUMNS[opts.sort ?? "projects"] ?? "project_count";

  let q = admin.from("company_stats").select("*", { count: "exact" });
  if (opts.role && opts.role !== "all") q = q.contains("roles", [opts.role]);
  if (opts.q) {
    const term = opts.q.replace(/[(),%]/g, " ").trim();
    if (term) {
      q = q.or(
        `canonical_name.ilike.%${term}%,markets_text.ilike.%${term}%`,
      );
    }
  }
  if (opts.market) {
    const market = opts.market.replace(/[(),%]/g, " ").trim();
    if (market) q = q.ilike("markets_text", `%${market}%`);
  }
  if (opts.activity === "open") q = q.gt("open_count", 0);
  if (opts.activity === "behind") q = q.gt("behind_count", 0);
  if (opts.recent) {
    const days = Number(opts.recent);
    if (Number.isFinite(days) && days > 0) {
      const since = new Date(Date.now() - days * 86_400_000)
        .toISOString()
        .slice(0, 10);
      q = q.gte("last_filed", since);
    }
  }
  if (opts.minProjects) {
    const minimum = Number(opts.minProjects);
    if (Number.isFinite(minimum) && minimum > 0) {
      q = q.gte("project_count", minimum);
    }
  }
  if (opts.minSqft) {
    const minimum = Number(opts.minSqft);
    if (Number.isFinite(minimum) && minimum > 0) {
      q = q.gte("largest_project_sqft", minimum);
    }
  }
  q = q
    .order(sortCol, {
      ascending: sortCol === "canonical_name",
      nullsFirst: false,
    })
    .order("canonical_name", { ascending: true })
    .range(from, from + COMPANIES_PAGE - 1);

  const { data, count, error } = await q;
  if (error) throw error;

  return {
    rows: (data ?? []) as CompanyStat[],
    total: count ?? 0,
    page,
  };
}
