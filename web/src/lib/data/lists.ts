import { admin } from "@/lib/supabase/admin";

export type ListSummary = {
  id: number;
  name: string;
  is_system: boolean;
  count: number;
};

export type ListItem = {
  id: number;
  project_number: string | null;
  company_id: number | null;
  note: string | null;
  added_by: string | null;
  assigned_to: string | null;
  due_date: string | null;
  resolved: boolean;
  title: string;
  subtitle: string | null;
  status: string | null;
  href: string;
};

async function eliteId(): Promise<number | null> {
  const { data } = await admin
    .from("workspaces")
    .select("id")
    .eq("slug", "elite")
    .maybeSingle();
  return data?.id ?? null;
}

export async function getLists(): Promise<ListSummary[]> {
  const wsid = await eliteId();
  if (!wsid) return [];
  const { data: lists } = await admin
    .from("lists")
    .select("id, name, is_system")
    .eq("workspace_id", wsid)
    .order("is_system", { ascending: false })
    .order("name");
  const ids = (lists ?? []).map((l) => l.id);
  const counts = new Map<number, number>();
  if (ids.length) {
    const { data: items } = await admin
      .from("list_items")
      .select("list_id")
      .in("list_id", ids);
    for (const it of items ?? [])
      counts.set(it.list_id, (counts.get(it.list_id) ?? 0) + 1);
  }
  return (lists ?? []).map((l) => ({
    ...l,
    count: counts.get(l.id) ?? 0,
  }));
}

export async function getList(id: number) {
  const { data: list } = await admin
    .from("lists")
    .select("id, name, is_system")
    .eq("id", id)
    .maybeSingle();
  if (!list) return null;

  const { data: rows } = await admin
    .from("list_items")
    .select(
      "id, project_number, company_id, note, added_by, assigned_to, due_date, resolved, " +
        "projects(project_name, facility_name, location_city, location_state, current_status), " +
        "companies(canonical_name, kind)",
    )
    .eq("list_id", id)
    .order("created_at", { ascending: false });

  type Row = {
    id: number;
    project_number: string | null;
    company_id: number | null;
    note: string | null;
    added_by: string | null;
    assigned_to: string | null;
    due_date: string | null;
    resolved: boolean;
    projects: {
      project_name: string | null;
      facility_name: string | null;
      location_city: string | null;
      location_state: string | null;
      current_status: string | null;
    } | null;
    companies: { canonical_name: string | null; kind: string | null } | null;
  };

  const items: ListItem[] = ((rows ?? []) as unknown as Row[]).map((r) => {
    const p = Array.isArray(r.projects) ? r.projects[0] : r.projects;
    const c = Array.isArray(r.companies) ? r.companies[0] : r.companies;
    if (r.project_number) {
      return {
        id: r.id,
        project_number: r.project_number,
        company_id: null,
        note: r.note,
        added_by: r.added_by,
        assigned_to: r.assigned_to,
        due_date: r.due_date,
        resolved: r.resolved,
        title: p?.project_name || p?.facility_name || r.project_number,
        subtitle: p?.location_city
          ? `${p.location_city}, ${p.location_state ?? ""}`
          : null,
        status: p?.current_status ?? null,
        href: `/projects/${r.project_number}`,
      };
    }
    return {
      id: r.id,
      project_number: null,
      company_id: r.company_id,
      note: r.note,
      added_by: r.added_by,
      assigned_to: r.assigned_to,
      due_date: r.due_date,
      resolved: r.resolved,
      title: c?.canonical_name ?? `Company ${r.company_id}`,
      subtitle: c?.kind ?? null,
      status: null,
      href: `/companies/${r.company_id}`,
    };
  });

  return { list, items };
}
