"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { loadTemplateBlocks, loadQuoteBlocks, saveQuoteBlocks } from "@/lib/blocks/persistence";
import { calculateTotal } from "@/lib/blocks/pricing";
import type { BlockDraft } from "@/lib/blocks/types";
import type { PriceDisplayMode } from "@/lib/types/database";
import { sendEmail } from "@/lib/email/client";
import { quoteReceivedClientEmail } from "@/lib/email/templates/notifications";
import { quoteEditedAfterSigningClientEmail } from "@/lib/email/templates/signing";
import { PRIVACYBELEID_URL } from "@/lib/legal";
import { buildTranslatedOverlays } from "@/lib/translation/build-translated-overlays";

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

export async function createQuote(input: {
  title: string;
  clientId: string;
  templateId: string | null;
  eventDate: string | null;
}) {
  const { supabase, organizationId, userId } = await requireOrganization();

  const { data: client } = await supabase
    .from("clients")
    .select("name, email, phone, company_name")
    .eq("id", input.clientId)
    .maybeSingle();

  const { data: quote, error } = await supabase
    .from("quotes")
    .insert({
      organization_id: organizationId,
      client_id: input.clientId,
      template_id: input.templateId,
      title: input.title,
      event_date: input.eventDate,
      created_by: userId,
      handled_by_profile_id: userId,
      client_display_name: client?.name ?? null,
      client_display_email: client?.email ?? null,
      client_display_phone: client?.phone ?? null,
      client_display_company: client?.company_name ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;

  if (input.templateId) {
    const templateBlocks = await loadTemplateBlocks(supabase, input.templateId);
    if (templateBlocks.length > 0) {
      await saveQuoteBlocks(supabase, quote.id, templateBlocks);
      await recalculateTotals(supabase, quote.id);
    }
  }

  redirect(`/dashboard/offertes/${quote.id}`);
}

export async function saveQuoteMeta(
  quoteId: string,
  input: {
    title: string;
    eventDate: string | null;
    validUntil: string | null;
    priceDisplay: PriceDisplayMode;
    pricePerPerson: boolean;
    discountAmount: number;
    language: string;
    aantalPersonenActief: boolean;
    handledByProfileId: string | null;
    clientDisplayName: string;
    clientDisplayEmail: string;
    clientDisplayPhone: string;
    clientDisplayCompany: string;
    referenceNumber: string;
  },
) {
  const { supabase } = await requireOrganization();

  const { error } = await supabase
    .from("quotes")
    .update({
      title: input.title,
      event_date: input.eventDate,
      valid_until: input.validUntil,
      price_display: input.priceDisplay,
      price_per_person: input.pricePerPerson,
      discount_amount: input.discountAmount,
      language: input.language,
      aantal_personen_actief: input.aantalPersonenActief,
      handled_by_profile_id: input.handledByProfileId,
      client_display_name: input.clientDisplayName || null,
      client_display_email: input.clientDisplayEmail || null,
      client_display_phone: input.clientDisplayPhone || null,
      client_display_company: input.clientDisplayCompany || null,
      reference_number: input.referenceNumber || null,
    })
    .eq("id", quoteId);
  if (error) throw error;

  await recalculateTotals(supabase, quoteId);
  revalidatePath(`/dashboard/offertes/${quoteId}`);
}

export async function saveQuoteBlocksAction(quoteId: string, blocks: BlockDraft[]) {
  const { supabase } = await requireOrganization();
  await saveQuoteBlocks(supabase, quoteId, blocks);
  await recalculateTotals(supabase, quoteId);
  revalidatePath(`/dashboard/offertes/${quoteId}`);
}

async function recalculateTotals(
  supabase: Awaited<ReturnType<typeof createClient>>,
  quoteId: string,
) {
  const { data: quote } = await supabase
    .from("quotes")
    .select("discount_amount")
    .eq("id", quoteId)
    .single();
  if (!quote) return;

  const { data: packageBlocks } = await supabase
    .from("quote_blocks")
    .select("id")
    .eq("quote_id", quoteId)
    .eq("type", "packages");

  let subtotal = 0;
  for (const block of packageBlocks ?? []) {
    const { data: defaultPackage } = await supabase
      .from("quote_packages")
      .select("price")
      .eq("quote_block_id", block.id)
      .eq("is_default_selected", true)
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();
    subtotal += defaultPackage ? Number(defaultPackage.price) : 0;
  }

  const total = calculateTotal({
    subtotal,
    discountAmount: Number(quote.discount_amount),
  });

  await supabase.from("quotes").update({ subtotal, total }).eq("id", quoteId);
}

export type TranslateQuoteResult = { ok: true } | { ok: false; error: string };

export async function translateQuoteBlocks(quoteId: string): Promise<TranslateQuoteResult> {
  const { supabase } = await requireOrganization();

  const blocks = await loadQuoteBlocks(supabase, quoteId);
  const result = await buildTranslatedOverlays(blocks);

  if (!result.ok) {
    if (result.reason === "not_configured") {
      return { ok: false, error: "Vertalen is niet geconfigureerd — voeg ANTHROPIC_API_KEY toe aan .env.local." };
    }
    return { ok: false, error: result.error };
  }

  for (let i = 0; i < blocks.length; i++) {
    const { error } = await supabase
      .from("quote_blocks")
      .update({ content_en: result.overlays[i] })
      .eq("id", blocks[i].id);
    if (error) {
      console.error("translateQuoteBlocks: kon content_en niet opslaan", error);
      return { ok: false, error: "Kon de vertaling niet opslaan. Probeer het opnieuw." };
    }
  }

  revalidatePath(`/dashboard/offertes/${quoteId}`);
  return { ok: true };
}

export async function detachFromTemplate(quoteId: string) {
  const { supabase } = await requireOrganization();
  const { error } = await supabase.from("quotes").update({ template_id: null }).eq("id", quoteId);
  if (error) throw error;
  revalidatePath(`/dashboard/offertes/${quoteId}`);
}

export async function sendQuote(quoteId: string) {
  const { supabase } = await requireOrganization();

  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", quoteId)
    .single();
  if (quoteError) throw quoteError;

  const { data: blockRows } = await supabase
    .from("quote_blocks")
    .select("id, type, position, content")
    .eq("quote_id", quoteId)
    .order("position", { ascending: true });

  const { count } = await supabase
    .from("quote_versions")
    .select("id", { count: "exact", head: true })
    .eq("quote_id", quoteId);

  const { error: versionError } = await supabase.from("quote_versions").insert({
    quote_id: quoteId,
    version_number: (count ?? 0) + 1,
    snapshot: { quote, blocks: blockRows ?? [] },
    total: Number(quote.total),
    reason: "sent",
  });
  if (versionError) throw versionError;

  const { error: updateError } = await supabase
    .from("quotes")
    .update({
      status: "verzonden",
      sent_at: new Date().toISOString(),
    })
    .eq("id", quoteId);
  if (updateError) throw updateError;

  if (quote.client_id) {
    const [{ data: client }, { data: organization }, h] = await Promise.all([
      supabase.from("clients").select("name, email").eq("id", quote.client_id).maybeSingle(),
      supabase.from("organizations").select("brand_name, terms_url").eq("id", quote.organization_id).single(),
      headers(),
    ]);
    if (client?.email) {
      const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
      const shareUrl = `${origin}/offerte/${quote.share_token}`;
      await sendEmail({
        to: client.email,
        subject: `Je offerte "${quote.title}" van ${organization?.brand_name ?? "Feest aan het Water"}`,
        html: quoteReceivedClientEmail({
          organizationName: organization?.brand_name ?? "Feest aan het Water",
          clientName: client.name,
          quoteTitle: quote.title,
          shareUrl,
          termsUrl: organization?.terms_url ?? null,
          privacyUrl: `${origin}${PRIVACYBELEID_URL}`,
        }),
      });
    }
  }

  revalidatePath(`/dashboard/offertes/${quoteId}`);
  revalidatePath("/dashboard/offertes");
}

export async function replyToComment(quoteId: string, blockId: string | null, body: string) {
  const { supabase, userId } = await requireOrganization();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", userId)
    .single();

  const { error } = await supabase.from("comments").insert({
    quote_id: quoteId,
    block_id: blockId,
    author_type: "agency",
    author_name: profile?.full_name || profile?.email || "Bureau",
    author_user_id: userId,
    body,
  });
  if (error) throw error;

  revalidatePath(`/dashboard/offertes/${quoteId}`);
}

/**
 * Informeert de klant die de offerte heeft ondertekend dat het bureau 'm
 * daarna nog heeft aangepast. Wordt eenmalig aangeroepen op het moment dat
 * het bureau bevestigt een al-geaccepteerde offerte te willen bewerken —
 * niet bij elke losse autosave daarna.
 */
export async function notifySignerOfEdit(quoteId: string) {
  const { supabase } = await requireOrganization();

  const [{ data: quote }, { data: signature }] = await Promise.all([
    supabase.from("quotes").select("title, share_token, organization_id").eq("id", quoteId).single(),
    supabase
      .from("signatures")
      .select("signer_name, signer_email")
      .eq("quote_id", quoteId)
      .order("signed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (!quote || !signature?.signer_email) return;

  const { data: organization } = await supabase
    .from("organizations")
    .select("brand_name, terms_url")
    .eq("id", quote.organization_id)
    .single();

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;

  await sendEmail({
    to: signature.signer_email,
    subject: `Update over je geaccepteerde offerte "${quote.title}"`,
    html: quoteEditedAfterSigningClientEmail({
      organizationName: organization?.brand_name ?? "Feest aan het Water",
      signerName: signature.signer_name,
      quoteTitle: quote.title,
      shareUrl: `${origin}/offerte/${quote.share_token}`,
      termsUrl: organization?.terms_url ?? null,
      privacyUrl: `${origin}${PRIVACYBELEID_URL}`,
    }),
  });
}

export async function deleteQuote(quoteId: string) {
  const { supabase } = await requireOrganization();
  const { error } = await supabase.from("quotes").delete().eq("id", quoteId);
  if (error) throw error;
  revalidatePath("/dashboard/offertes");
}
