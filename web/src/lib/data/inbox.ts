import { admin } from "@/lib/supabase/admin";

export type InboxItem = {
  id: number;
  project_number: string;
  reason: string;
  reason_bullets: string[];
  ai_summary: string | null;
  created_at: string;
  title: string;
  city: string | null;
  status: string | null;
  sqft: number | null;
  cost: number | null;
  completion: string | null;
};

export async function getInbox() {
  const { data: ws } = await admin
    .from("workspaces")
    .select("id")
    .eq("slug", "elite")
    .maybeSingle();
  if (!ws) return { items: [] as InboxItem[], watchlistId: null, followupId: null };

  const { data: lists } = await admin
    .from("lists")
    .select("id, name")
    .eq("workspace_id", ws.id);
  const watchlistId = lists?.find((l) => l.name === "Watchlist")?.id ?? null;
  const followupId = lists?.find((l) => l.name === "Follow-Up")?.id ?? null;

  const { data } = await admin
    .from("inbox_items")
    .select(
      "id, project_number, reason, reason_bullets, ai_summary, created_at, " +
        "projects(project_name, facility_name, location_city, location_state, current_status, square_footage, estimated_cost, completion_date)",
    )
    .eq("workspace_id", ws.id)
    .eq("state", "new")
    .order("created_at", { ascending: false })
    .limit(100);

  type Row = {
    id: number;
    project_number: string;
    reason: string;
    reason_bullets: string[] | null;
    ai_summary: string | null;
    created_at: string;
    projects:
      | {
          project_name: string | null;
          facility_name: string | null;
          location_city: string | null;
          location_state: string | null;
          current_status: string | null;
          square_footage: number | null;
          estimated_cost: number | null;
          completion_date: string | null;
        }
      | null;
  };

  const items: InboxItem[] = ((data ?? []) as unknown as Row[]).map((r) => {
    const p = Array.isArray(r.projects) ? r.projects[0] : r.projects;
    return {
      id: r.id,
      project_number: r.project_number,
      reason: r.reason,
      reason_bullets: r.reason_bullets ?? [],
      ai_summary: r.ai_summary,
      created_at: r.created_at,
      title: p?.project_name || p?.facility_name || r.project_number,
      city: p?.location_city
        ? `${p.location_city}, ${p.location_state ?? ""}`
        : null,
      status: p?.current_status ?? null,
      sqft: p?.square_footage ?? null,
      cost: p?.estimated_cost ?? null,
      completion: p?.completion_date ?? null,
    };
  });

  return { items, watchlistId, followupId };
}
