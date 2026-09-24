"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { LEAD_PURPOSE_LABELS } from "./status";

async function requireOrganization() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();
  if (!profile) throw new Error("Geen organisatie gevonden voor deze gebruiker.");
  if (profile.role === "readonly") throw new Error("Alleen-lezen teamleden mogen dit niet aanpassen.");

  return { supabase, organizationId: profile.organization_id, userId: user.id };
}

export async function markLeadContacted(leadId: string) {
  const { supabase } = await requireOrganization();
  const { error } = await supabase.from("leads").update({ status: "gecontacteerd" }).eq("id", leadId);
  if (error) throw error;
  revalidatePath("/dashboard/leads");
}

export async function rejectLead(leadId: string) {
  const { supabase } = await requireOrganization();
  const { error } = await supabase.from("leads").update({ status: "afgewezen" }).eq("id", leadId);
  if (error) throw error;
  revalidatePath("/dashboard/leads");
}

/**
 * Zet een lead om naar een echte offerte-aanvraag (quote_requests) -- geen
 * template gekozen (dat doet het bureau zelf op de aanvraag/offerte), maar
 * alle gegevens (incl. waarvoor/bericht, samengevoegd in `notes`) worden
 * overgenomen zodat er niets verloren gaat. Eindigt met `redirect()` — roep
 * deze actie aan zonder try/catch aan de clientkant (zelfde bekende valkuil
 * als bij deleteClient/convertQuoteRequestToQuote, zie HANDOVER.md).
 *
 * `quote_requests` heeft bewust geen insert-policy voor gewone ingelogde
 * gebruikers (alleen de publieke aanvraagflow mag rijen aanmaken) -- de
 * insert hieronder gaat daarom via de service-role client, ondanks dat
 * `requireOrganization()` hierboven al org-toegang bevestigd heeft. Zelfde
 * patroon als `createDemoRequestForFaq()`.
 */
export async function convertLeadToRequest(leadId: string) {
  const { supabase, organizationId } = await requireOrganization();

  const { data: lead, error: leadError } = await supabase.from("leads").select("*").eq("id", leadId).single();
  if (leadError) throw leadError;

  const notes = [`Waarvoor: ${LEAD_PURPOSE_LABELS[lead.purpose]}`, lead.message].filter(Boolean).join("\n\n");

  const adminSupabase = createAdminClient();
  const { data: request, error: requestError } = await adminSupabase
    .from("quote_requests")
    .insert({
      organization_id: organizationId,
      template_id: null,
      customer_name: lead.name,
      customer_email: lead.email,
      customer_phone: lead.phone,
      customer_company: lead.company_name,
      guest_count: lead.guest_count,
      desired_date: lead.preferred_date,
      notes,
    })
    .select("id")
    .single();
  if (requestError) throw requestError;

  const { error: updateError } = await supabase
    .from("leads")
    .update({ status: "omgezet", converted_request_id: request.id })
    .eq("id", leadId);
  if (updateError) throw updateError;

  revalidatePath("/dashboard/leads");
  redirect(`/dashboard/aanvragen/${request.id}`);
}

/**
 * Tijdelijke, duidelijk gelabelde voorbeeldlead voor het FAQ-stappenplan --
 * zelfde opzet als createDemoRequestForFaq (leads heeft ook bewust geen
 * insert-policy voor gewone ingelogde gebruikers, dus service-role nodig
 * ook hier, ondanks dat requireOrganization al org-toegang bevestigd heeft).
 */
export async function createDemoLeadForFaq(): Promise<string> {
  const { organizationId } = await requireOrganization();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("leads")
    .insert({
      organization_id: organizationId,
      name: "Voorbeeldlead (rondleiding)",
      email: "voorbeeld@rondleiding.kwotio.app",
      phone: "0600000000",
      purpose: "uitje",
      guest_count: 10,
      preferred_date: new Date().toISOString().slice(0, 10),
      message: "Dit is een voorbeeldlead voor de rondleiding.",
      status: "nieuw",
    })
    .select("id")
    .single();
  if (error) throw error;

  return data.id;
}

export async function deleteLead(leadId: string) {
  const { supabase } = await requireOrganization();
  const { error } = await supabase.from("leads").delete().eq("id", leadId);
  if (error) throw error;
  revalidatePath("/dashboard/leads");
}
