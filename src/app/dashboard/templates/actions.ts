"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { saveTemplateBlocks } from "@/lib/blocks/persistence";
import type { BlockDraft } from "@/lib/blocks/types";

async function requireOrganizationId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();
  if (!profile) throw new Error("Geen organisatie gevonden voor deze gebruiker.");

  return { supabase, organizationId: profile.organization_id, userId: user.id };
}

export async function createTemplate(input: { name: string; eventType: string }) {
  const { supabase, organizationId, userId } = await requireOrganizationId();

  const { data, error } = await supabase
    .from("templates")
    .insert({
      organization_id: organizationId,
      name: input.name,
      event_type: input.eventType,
      created_by: userId,
    })
    .select("id")
    .single();
  if (error) throw error;

  redirect(`/dashboard/templates/${data.id}`);
}

export async function updateTemplateMeta(
  templateId: string,
  input: { name: string; eventType: string; language: string; isActive: boolean },
) {
  const { supabase } = await requireOrganizationId();

  const { error } = await supabase
    .from("templates")
    .update({
      name: input.name,
      event_type: input.eventType,
      language: input.language,
      is_active: input.isActive,
    })
    .eq("id", templateId);
  if (error) throw error;

  revalidatePath(`/dashboard/templates/${templateId}`);
  revalidatePath("/dashboard/templates");
}

export async function saveTemplateBlocksAction(templateId: string, blocks: BlockDraft[]) {
  const { supabase } = await requireOrganizationId();
  await saveTemplateBlocks(supabase, templateId, blocks);
  revalidatePath(`/dashboard/templates/${templateId}`);
}

export async function deleteTemplate(templateId: string) {
  const { supabase } = await requireOrganizationId();
  const { error } = await supabase.from("templates").delete().eq("id", templateId);
  if (error) throw error;
  revalidatePath("/dashboard/templates");
  redirect("/dashboard/templates");
}
