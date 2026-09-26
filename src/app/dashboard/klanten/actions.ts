"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

async function requireOrganizationId() {
  const supabase = await createSupabaseServerClient();
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

  return { supabase, organizationId: profile.organization_id };
}

export async function searchClients(query: string) {
  const { supabase, organizationId } = await requireOrganizationId();

  const { data, error } = await supabase
    .from("clients")
    .select("id, name, email, phone, company_name")
    .eq("organization_id", organizationId)
    .is("archived_at", null)
    .ilike("name", `%${query}%`)
    .order("name", { ascending: true })
    .limit(10);
  if (error) throw error;

  return data ?? [];
}

/** Zelfde normalisatie als aanvragen/status.ts's duplicaat-aanvraag-detectie
 * (los gehouden, geen gedeelde export nodig voor zo'n kleine functie). */
function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9+]/g, "");
}

export type DuplicateClientMatch = { id: string; name: string; companyName: string | null };

/** Waarschuwt vóór het aanmaken van een klant als er al een klant met
 * hetzelfde e-mailadres of telefoonnummer bestaat in de organisatie
 * (inclusief gearchiveerde klanten -- "bestaat al" geldt ook dan). Geen
 * harde blokkade, puur een signaal; het bureau kan altijd toch doorgaan. */
export async function checkDuplicateClient(email: string, phone?: string): Promise<DuplicateClientMatch | null> {
  const { supabase, organizationId } = await requireOrganizationId();
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPhone = phone?.trim() ? normalizePhone(phone) : null;
  if (!normalizedEmail && !normalizedPhone) return null;

  const { data, error } = await supabase
    .from("clients")
    .select("id, name, email, phone, company_name")
    .eq("organization_id", organizationId);
  if (error) throw error;

  const match = (data ?? []).find((c) => {
    if (normalizedEmail && c.email?.trim().toLowerCase() === normalizedEmail) return true;
    if (normalizedPhone && c.phone && normalizePhone(c.phone) === normalizedPhone) return true;
    return false;
  });

  return match ? { id: match.id, name: match.name, companyName: match.company_name } : null;
}

export async function createClientRecord(input: { name: string; email: string; phone?: string; companyName?: string }) {
  const { supabase, organizationId } = await requireOrganizationId();

  if (!input.name.trim() || !input.email.trim()) {
    throw new Error("Naam en e-mailadres zijn verplicht.");
  }

  const { data, error } = await supabase
    .from("clients")
    .insert({
      organization_id: organizationId,
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      company_name: input.companyName || null,
    })
    .select("id, name, email, phone, company_name")
    .single();
  if (error) throw error;

  return data;
}

export async function createClientAndRedirect(input: {
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  notes?: string;
}) {
  const { supabase, organizationId } = await requireOrganizationId();

  if (!input.name.trim() || !input.email.trim()) {
    throw new Error("Naam en e-mailadres zijn verplicht.");
  }

  const { data, error } = await supabase
    .from("clients")
    .insert({
      organization_id: organizationId,
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      company_name: input.companyName || null,
      notes: input.notes || null,
    })
    .select("id")
    .single();
  if (error) throw error;

  revalidatePath("/dashboard/klanten");
  redirect(`/dashboard/klanten/${data.id}`);
}

export async function updateClient(
  clientId: string,
  input: { name: string; email: string; phone: string; companyName: string; notes: string },
) {
  const { supabase } = await requireOrganizationId();

  const { error } = await supabase
    .from("clients")
    .update({
      name: input.name,
      email: input.email || null,
      phone: input.phone || null,
      company_name: input.companyName || null,
      notes: input.notes || null,
    })
    .eq("id", clientId);
  if (error) throw error;

  revalidatePath(`/dashboard/klanten/${clientId}`);
  revalidatePath("/dashboard/klanten");
}

/** "Verwijderen" is een zachte verwijdering -- de klant verdwijnt uit elke
 * gewone lijst/query (RLS-select-policy filtert `deleted_at is null`, zie
 * migratie 0082) maar blijft 30 dagen herstelbaar via de prullenbak. Een
 * dagelijkse cron-stap ruimt rijen ouder dan 30 dagen definitief op. */
export async function deleteClient(clientId: string) {
  const { supabase } = await requireOrganizationId();
  const { error } = await supabase
    .from("clients")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", clientId);
  if (error) throw error;
  revalidatePath("/dashboard/klanten");
}

export async function deleteClients(clientIds: string[]) {
  const { supabase } = await requireOrganizationId();
  const { error } = await supabase
    .from("clients")
    .update({ deleted_at: new Date().toISOString() })
    .in("id", clientIds);
  if (error) throw error;
  revalidatePath("/dashboard/klanten");
}

export async function restoreClient(clientId: string) {
  const { supabase } = await requireOrganizationId();
  const { error } = await supabase.from("clients").update({ deleted_at: null }).eq("id", clientId);
  if (error) throw error;
  revalidatePath("/dashboard/klanten");
  revalidatePath("/dashboard/klanten/prullenbak");
}

export async function archiveClient(clientId: string) {
  const { supabase } = await requireOrganizationId();
  const { error } = await supabase
    .from("clients")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", clientId);
  if (error) throw error;
  revalidatePath("/dashboard/klanten");
  revalidatePath("/dashboard/klanten/archief");
  revalidatePath(`/dashboard/klanten/${clientId}`);
}

export async function unarchiveClient(clientId: string) {
  const { supabase } = await requireOrganizationId();
  const { error } = await supabase.from("clients").update({ archived_at: null }).eq("id", clientId);
  if (error) throw error;
  revalidatePath("/dashboard/klanten");
  revalidatePath("/dashboard/klanten/archief");
  revalidatePath(`/dashboard/klanten/${clientId}`);
}
