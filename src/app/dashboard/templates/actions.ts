"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { loadTemplateBlocks, saveTemplateBlocks } from "@/lib/blocks/persistence";
import { newBlock, duplicateBlockDraft, type BlockDraft } from "@/lib/blocks/types";

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

/**
 * Maakt een tijdelijk, duidelijk gelabeld voorbeeldtemplate aan voor de
 * FAQ-stappenplannen ("hoe maak ik een template" / "publiek zichtbaar") --
 * alleen het id, geen redirect. Wordt weer verwijderd zodra die rondleiding
 * sluit/afrondt (zie FaqWalkthroughProvider), via de bestaande
 * `deleteTemplateFromList`.
 */
export async function createDemoTemplateForFaq(): Promise<string> {
  const { supabase, organizationId, userId } = await requireOrganizationId();

  const { data, error } = await supabase
    .from("templates")
    .insert({
      organization_id: organizationId,
      name: "Voorbeeldtemplate (rondleiding)",
      event_type: "Voorbeeld",
      created_by: userId,
    })
    .select("id")
    .single();
  if (error) throw error;

  const demoBlocks: BlockDraft[] = [newBlock("text", 0), newBlock("packages", 1)];
  await saveTemplateBlocks(supabase, data.id, demoBlocks);

  return data.id;
}

export async function duplicateTemplate(templateId: string) {
  const { supabase, organizationId, userId } = await requireOrganizationId();

  const { data: source, error } = await supabase
    .from("templates")
    .select("name, event_type, description, language, is_active")
    .eq("id", templateId)
    .single();
  if (error) throw error;

  const sourceBlocks = await loadTemplateBlocks(supabase, templateId);

  const { data: newTemplate, error: insertError } = await supabase
    .from("templates")
    .insert({
      organization_id: organizationId,
      name: `${source.name} (kopie)`,
      event_type: source.event_type,
      description: source.description,
      language: source.language,
      is_active: source.is_active,
      // Bewust altijd uit, ongeacht de bron -- een kopie is nog niet
      // nagekeken door het bureau en mag niet meteen op de publieke
      // offertepagina naast (of in plaats van) het origineel verschijnen.
      is_publicly_visible: false,
      created_by: userId,
    })
    .select("id")
    .single();
  if (insertError) throw insertError;

  if (sourceBlocks.length > 0) {
    await saveTemplateBlocks(supabase, newTemplate.id, sourceBlocks.map(duplicateBlockDraft));
  }

  revalidatePath("/dashboard/templates");
  redirect(`/dashboard/templates/${newTemplate.id}`);
}

export async function updateTemplateMeta(
  templateId: string,
  input: {
    name: string;
    eventType: string;
    language: string;
    isActive: boolean;
    isPubliclyVisible: boolean;
    description: string;
  },
) {
  const { supabase } = await requireOrganizationId();

  const { error } = await supabase
    .from("templates")
    .update({
      name: input.name,
      event_type: input.eventType,
      language: input.language,
      is_active: input.isActive,
      is_publicly_visible: input.isPubliclyVisible,
      description: input.description.trim() || null,
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

/** Zelfde als deleteTemplate, maar zonder redirect — voor gebruik vanuit de
 * lijst-/archiefpagina zelf (waar je al bent), zodat de aanroeper de fout
 * veilig in een try/catch kan afvangen. deleteTemplate's eigen redirect()
 * zou daar, wanneer verpakt in try/catch, per ongeluk als mislukking
 * opgevangen worden — dit is Next.js-gedrag bij redirect() binnen een
 * server action. */
export async function deleteTemplateFromList(templateId: string) {
  const { supabase } = await requireOrganizationId();
  const { error } = await supabase.from("templates").delete().eq("id", templateId);
  if (error) throw error;
  revalidatePath("/dashboard/templates");
  revalidatePath("/dashboard/templates/archief");
}

export async function archiveTemplate(templateId: string) {
  const { supabase } = await requireOrganizationId();
  const { error } = await supabase
    .from("templates")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", templateId);
  if (error) throw error;
  revalidatePath("/dashboard/templates");
  revalidatePath("/dashboard/templates/archief");
  revalidatePath(`/dashboard/templates/${templateId}`);
}

/** Zelfde patroon als reorderArrangements: sort_order simpelweg gelijk aan
 * de positie in de meegegeven array zetten. Bepaalt zowel de volgorde in
 * deze lijst als op de publieke offertepagina (zie offertes/[slug]/data.ts). */
export async function reorderTemplates(orderedIds: string[]) {
  const { supabase } = await requireOrganizationId();
  await Promise.all(orderedIds.map((id, index) => supabase.from("templates").update({ sort_order: index }).eq("id", id)));
  revalidatePath("/dashboard/templates");
}

export async function unarchiveTemplate(templateId: string) {
  const { supabase } = await requireOrganizationId();
  const { error } = await supabase.from("templates").update({ archived_at: null }).eq("id", templateId);
  if (error) throw error;
  revalidatePath("/dashboard/templates");
  revalidatePath("/dashboard/templates/archief");
  revalidatePath(`/dashboard/templates/${templateId}`);
}
