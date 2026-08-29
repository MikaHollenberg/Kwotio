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

export async function deleteClient(clientId: string) {
  const { supabase } = await requireOrganizationId();
  const { error } = await supabase.from("clients").delete().eq("id", clientId);
  if (error) throw error;
  revalidatePath("/dashboard/klanten");
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
