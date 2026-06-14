import { admin } from "@/lib/supabase/admin";
import type { CompanyRef } from "@/lib/data/projects";

export type ProjectDetail = {
  project_number: string;
  project_name: string | null;
  facility_name: string | null;
  location_full: string | null;
  location_city: string | null;
  location_state: string | null;
  location_zip: string | null;
  location_county: string | null;
  current_status: string | null;
  type_of_work: string | null;
  type_of_funds: string | null;
  scope_of_work: string | null;
  square_footage: number | null;
  estimated_cost: number | null;
  start_date: string | null;
  completion_date: string | null;
  registration_date: string | null;
  tenant_private_funds: boolean | null;
  filer_contact_name: string | null;
  last_seen_at: string | null;
  last_changed_at: string | null;
};

export type ChangeRow = {
  field: string | null;
  old_value: string | null;
  new_value: string | null;
  kind: string;
  changed_at: string;
};

export type Connection = CompanyRef & {
  phone: string | null;
  address: string | null;
};

export async function getProject(pn: string) {
  const [projectResult, linksResult, changesResult] = await Promise.all([
    admin
      .from("projects")
      .select(
        "project_number, project_name, facility_name, location_full, location_city, " +
          "location_state, location_zip, location_county, current_status, type_of_work, " +
          "type_of_funds, scope_of_work, square_footage, estimated_cost, start_date, " +
          "completion_date, registration_date, tenant_private_funds, filer_contact_name, " +
          "last_seen_at, last_changed_at",
      )
      .eq("project_number", pn)
      .maybeSingle(),
    admin
      .from("project_companies")
      .select("role, companies(id, canonical_name, phone, address)")
      .eq("project_number", pn)
      .in("role", ["owner", "tenant", "architect"]),
    admin
      .from("project_changes")
      .select("field, old_value, new_value, kind, changed_at")
      .eq("project_number", pn)
      .order("changed_at", { ascending: false }),
  ]);
  const project = projectResult.data;
  if (!project) return null;

  const connections: Connection[] = (linksResult.data ?? []).map((l) => {
    const co = Array.isArray(l.companies) ? l.companies[0] : l.companies;
    return {
      id: co?.id ?? 0,
      name: co?.canonical_name ?? "—",
      role: l.role,
      phone: co?.phone ?? null,
      address: co?.address ?? null,
    };
  });

  return {
    project: project as unknown as ProjectDetail,
    connections,
    changes: (changesResult.data ?? []) as ChangeRow[],
  };
}
