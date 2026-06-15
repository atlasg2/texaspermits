"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { admin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function currentEmail(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.email) return user.email;
  if (
    process.env.DEV_NO_AUTH === "true" &&
    process.env.NODE_ENV !== "production"
  ) {
    return "local-dev";
  }
  throw new Error("Unauthorized");
}

async function eliteWorkspaceId(): Promise<number> {
  const { data, error } = await admin
    .from("workspaces")
    .select("id")
    .eq("slug", "elite")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Workspace not found");
  return data.id;
}

export async function addProjectToList(listId: number, projectNumber: string) {
  const email = await currentEmail();
  const workspaceId = await eliteWorkspaceId();
  const { data: list, error: listError } = await admin
    .from("lists")
    .select("id")
    .eq("id", listId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (listError) throw listError;
  if (!list) throw new Error("List not found");

  // de-dupe: skip if already on the list
  const { data: existing, error: existingError } = await admin
    .from("list_items")
    .select("id")
    .eq("list_id", listId)
    .eq("project_number", projectNumber)
    .maybeSingle();
  if (existingError) throw existingError;
  if (!existing) {
    const { error } = await admin.from("list_items").insert({
      list_id: listId,
      project_number: projectNumber,
      added_by: email,
    });
    if (error) throw error;
  }
  revalidatePath("/lists");
  revalidatePath(`/projects/${projectNumber}`);
}

export async function createListAndAddProject(
  name: string,
  projectNumber: string,
) {
  const cleanName = name.trim().replace(/\s+/g, " ");
  if (!cleanName || cleanName.length > 60) {
    throw new Error("List names must be between 1 and 60 characters");
  }

  const workspaceId = await eliteWorkspaceId();
  const existingList = await admin
    .from("lists")
    .select("id, name")
    .eq("workspace_id", workspaceId)
    .ilike("name", cleanName)
    .maybeSingle();
  if (existingList.error) throw existingList.error;
  let list = existingList.data;

  if (!list) {
    const inserted = await admin
      .from("lists")
      .insert({
        workspace_id: workspaceId,
        name: cleanName,
        is_system: false,
      })
      .select("id, name")
      .single();
    if (inserted.error) throw inserted.error;
    list = inserted.data;
  }

  await addProjectToList(list.id, projectNumber);
  revalidatePath("/lists");
  return list;
}

export async function setProjectViewHidden(
  viewKey: string,
  projectNumber: string,
  hidden: boolean,
) {
  const validViews = new Set([
    "registered_10k",
    "new_changed",
    "active",
    "recently_completed",
    "possibly_late",
  ]);
  if (!validViews.has(viewKey)) throw new Error("Invalid view");

  const workspaceId = await eliteWorkspaceId();
  if (hidden) {
    const email = await currentEmail();
    const { data: project, error: projectError } = await admin
      .from("projects")
      .select("current_status")
      .eq("project_number", projectNumber)
      .maybeSingle();
    if (projectError) throw projectError;
    if (!project) throw new Error("Project not found");

    const { error } = await admin.from("project_view_state").upsert(
      {
        workspace_id: workspaceId,
        project_number: projectNumber,
        view_key: viewKey,
        status_at_hidden: project.current_status,
        hidden_by: email,
        hidden_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id,project_number,view_key" },
    );
    if (error) throw error;
  } else {
    const { error } = await admin
      .from("project_view_state")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("project_number", projectNumber)
      .eq("view_key", viewKey);
    if (error) throw error;
  }

  revalidatePath(`/views/${viewKey}`);
}

export async function removeListItem(itemId: number) {
  await admin.from("list_items").delete().eq("id", itemId);
  revalidatePath("/lists");
}

export async function setListItemFields(
  itemId: number,
  fields: { assigned_to?: string | null; due_date?: string | null; resolved?: boolean },
) {
  await admin.from("list_items").update(fields).eq("id", itemId);
  revalidatePath("/lists");
}

export async function setInboxState(
  itemId: number,
  state: "reviewed" | "dismissed",
) {
  const email = await currentEmail();
  await admin
    .from("inbox_items")
    .update({ state, acted_by: email, acted_at: new Date().toISOString() })
    .eq("id", itemId);
  revalidatePath("/inbox");
}

// Review = mark the event reviewed (it leaves the Inbox) and open the project.
export async function reviewAndOpen(itemId: number, projectNumber: string) {
  await setInboxState(itemId, "reviewed");
  redirect(`/projects/${projectNumber}`);
}

// Add to a list straight from the Inbox (does not dismiss the event).
export async function addInboxToList(
  itemId: number,
  listId: number,
  projectNumber: string,
) {
  await addProjectToList(listId, projectNumber);
  revalidatePath("/inbox");
}
