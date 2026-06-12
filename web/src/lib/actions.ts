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
  return user?.email ?? "unknown";
}

export async function addProjectToList(listId: number, projectNumber: string) {
  const email = await currentEmail();
  // de-dupe: skip if already on the list
  const { data: existing } = await admin
    .from("list_items")
    .select("id")
    .eq("list_id", listId)
    .eq("project_number", projectNumber)
    .maybeSingle();
  if (!existing) {
    await admin.from("list_items").insert({
      list_id: listId,
      project_number: projectNumber,
      added_by: email,
    });
  }
  revalidatePath("/lists");
  revalidatePath(`/projects/${projectNumber}`);
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
