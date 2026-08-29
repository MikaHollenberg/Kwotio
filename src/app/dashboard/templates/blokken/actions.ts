"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { defaultContentFor } from "@/lib/blocks/types";
import type { BlockType } from "@/lib/types/database";

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

export async function createBlockTemplate(input: { name: string; type: BlockType }) {
  const { supabase, organizationId, userId } = await requireOrganizationId();

  const { data, error } = await supabase
    .from("block_templates")
    .insert({
      organization_id: organizationId,
      type: input.type,
      name: input.name,
      content: defaultContentFor(input.type),
      created_by: userId,
    })
    .select("id")
    .single();
  if (error) throw error;

  redirect(`/dashboard/templates/blokken/${data.id}`);
}

/** Maakt een blok-template op basis van een al-ingevuld blok uit een offerte
 * of hele-offerte-template ("Opslaan als blok-template"-actie). Geen
 * redirect nodig — de gebruiker blijft in de editor waar hij vandaan komt. */
export async function createBlockTemplateFromContent(input: {
  name: string;
  type: BlockType;
  content: Record<string, unknown>;
}): Promise<{ id: string; type: BlockType; name: string; content: Record<string, unknown> }> {
  const { supabase, organizationId, userId } = await requireOrganizationId();

  const { data, error } = await supabase
    .from("block_templates")
    .insert({
      organization_id: organizationId,
      type: input.type,
      name: input.name,
      content: input.content,
      created_by: userId,
    })
    .select("id, type, name, content")
    .single();
  if (error) throw error;

  revalidatePath("/dashboard/templates/blokken");
  return data;
}

export async function renameBlockTemplate(blockTemplateId: string, name: string) {
  const { supabase } = await requireOrganizationId();

  const { error } = await supabase.from("block_templates").update({ name }).eq("id", blockTemplateId);
  if (error) throw error;

  revalidatePath(`/dashboard/templates/blokken/${blockTemplateId}`);
  revalidatePath("/dashboard/templates/blokken");
}

export async function saveBlockTemplateContent(blockTemplateId: string, content: Record<string, unknown>) {
  const { supabase } = await requireOrganizationId();

  const { error } = await supabase.from("block_templates").update({ content }).eq("id", blockTemplateId);
  if (error) throw error;

  revalidatePath(`/dashboard/templates/blokken/${blockTemplateId}`);
}

export async function deleteBlockTemplate(blockTemplateId: string) {
  const { supabase } = await requireOrganizationId();
  const { error } = await supabase.from("block_templates").delete().eq("id", blockTemplateId);
  if (error) throw error;

  revalidatePath("/dashboard/templates/blokken");
  redirect("/dashboard/templates/blokken");
}
