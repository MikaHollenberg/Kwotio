"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadTemplateBlocks, saveQuoteBlocks } from "@/lib/blocks/persistence";
import { recalculateTotals } from "@/app/dashboard/offertes/actions";
import type { QuoteRequestStatus } from "@/lib/types/database";

async function requireOrganization() {
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

export async function updateQuoteRequestStatus(requestId: string, status: QuoteRequestStatus) {
  const { supabase } = await requireOrganization();
  const { error } = await supabase.from("quote_requests").update({ status }).eq("id", requestId);
  if (error) throw error;
  revalidatePath("/dashboard/aanvragen");
  revalidatePath(`/dashboard/aanvragen/${requestId}`);
}

/**
 * Maakt een tijdelijke, duidelijk gelabelde voorbeeldaanvraag aan voor het
 * FAQ-stappenplan "hoe zet ik een aanvraag om in een offerte" -- alleen het
 * id. Wordt weer verwijderd zodra die rondleiding sluit/afrondt (zie
 * FaqWalkthroughProvider), via de bestaande `deleteQuoteRequest`.
 */
export async function createDemoRequestForFaq(): Promise<string> {
  const { organizationId } = await requireOrganization();
  // quote_requests heeft bewust geen insert-policy voor gewone ingelogde
  // gebruikers (alleen de publieke service-role-flow mag rijen aanmaken,
  // zie HANDOVER.md) -- deze interne demo-aanvraag gaat daarom via de
  // service-role client, met organizationId server-side afgeleid (nooit
  // vertrouwd vanuit de client).
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("quote_requests")
    .insert({
      organization_id: organizationId,
      customer_name: "Voorbeeldklant (rondleiding)",
      customer_email: "voorbeeld@rondleiding.kwotio.app",
      customer_phone: "0600000000",
      status: "nieuw",
    })
    .select("id")
    .single();
  if (error) throw error;

  return data.id;
}

/** Geen redirect — aanroeper (lijst-rij of detailscherm) bepaalt zelf de
 * navigatie na afloop, zelfde reden als deleteTemplateFromList/deleteClient. */
export async function deleteQuoteRequest(requestId: string) {
  const { supabase } = await requireOrganization();
  const { error } = await supabase.from("quote_requests").delete().eq("id", requestId);
  if (error) throw error;
  revalidatePath("/dashboard/aanvragen");
}

/**
 * Zet een aanvraag om naar een echte offerte — zelfde opzet als `createQuote`
 * in app/src/app/dashboard/offertes/actions.ts (klant zoeken-of-aanmaken,
 * quote-insert met vooringevulde klantgegevens, template-blokken kopiëren),
 * hergebruikt ook dezelfde `recalculateTotals()`. Eindigt met `redirect()` —
 * roep deze actie aan zonder try/catch aan de clientkant (zelfde bekende
 * valkuil als bij `deleteClient`, zie HANDOVER.md).
 */
export async function convertQuoteRequestToQuote(requestId: string) {
  const { supabase, organizationId, userId } = await requireOrganization();

  const { data: request, error: requestError } = await supabase
    .from("quote_requests")
    .select("*")
    .eq("id", requestId)
    .single();
  if (requestError) throw requestError;

  let clientId: string | null = null;
  if (request.customer_email) {
    const { data: existingClient } = await supabase
      .from("clients")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("email", request.customer_email)
      .is("archived_at", null)
      .maybeSingle();
    clientId = existingClient?.id ?? null;
  }
  if (!clientId) {
    const { data: newClient, error: clientError } = await supabase
      .from("clients")
      .insert({
        organization_id: organizationId,
        name: request.customer_name,
        email: request.customer_email,
        phone: request.customer_phone,
        company_name: request.customer_company,
      })
      .select("id")
      .single();
    if (clientError) throw clientError;
    clientId = newClient.id;
  }

  const { data: organization } = await supabase
    .from("organizations")
    .select("aantal_personen_actief")
    .eq("id", organizationId)
    .single();

  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .insert({
      organization_id: organizationId,
      client_id: clientId,
      template_id: request.template_id,
      title: `Offerte voor ${request.customer_name}`,
      event_date: request.desired_date,
      created_by: userId,
      handled_by_profile_id: userId,
      client_display_name: request.customer_name,
      client_display_email: request.customer_email,
      client_display_phone: request.customer_phone,
      client_display_company: request.customer_company,
      price_display: "excl_btw",
      price_per_person: true,
      aantal_personen_actief: organization?.aantal_personen_actief ?? false,
    })
    .select("id")
    .single();
  if (quoteError) throw quoteError;

  if (request.template_id) {
    const templateBlocks = await loadTemplateBlocks(supabase, request.template_id);
    if (templateBlocks.length > 0) {
      await saveQuoteBlocks(supabase, quote.id, templateBlocks);
      await recalculateTotals(supabase, quote.id);
    }
  }

  const { error: updateError } = await supabase
    .from("quote_requests")
    .update({ status: "omgezet", converted_quote_id: quote.id })
    .eq("id", requestId);
  if (updateError) throw updateError;

  revalidatePath("/dashboard/aanvragen");
  redirect(`/dashboard/offertes/${quote.id}`);
}
