"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireOwnerOrAdmin() {
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
  if (profile.role !== "owner" && profile.role !== "admin") {
    throw new Error("Alleen eigenaren en admins mogen dit aanpassen.");
  }

  return { supabase, organizationId: profile.organization_id };
}

export async function updateInvoicingDefaults(fields: {
  invoiceNumberPrefix: string;
  invoiceDueDays: number;
  invoiceAutoSend: boolean;
  invoiceReminderEnabled: boolean;
  invoiceVatRateHigh: number;
  invoiceVatRateLow: number;
}) {
  const { supabase, organizationId } = await requireOwnerOrAdmin();
  const { error } = await supabase
    .from("organizations")
    .update({
      invoice_number_prefix: fields.invoiceNumberPrefix.trim() || null,
      invoice_due_days: fields.invoiceDueDays,
      invoice_auto_send: fields.invoiceAutoSend,
      invoice_reminder_enabled: fields.invoiceReminderEnabled,
      invoice_vat_rate_high: fields.invoiceVatRateHigh,
      invoice_vat_rate_low: fields.invoiceVatRateLow,
    })
    .eq("id", organizationId);
  if (error) throw error;
  revalidatePath("/dashboard/instellingen");
}

/** Max. 2 extra logo's op de factuurkop (naast het hoofdlogo, zie
 * migratie 0056) -- bv. voor een zusterbedrijf/afdeling. */
export async function updateInvoiceExtraLogos(urls: string[]) {
  const { supabase, organizationId } = await requireOwnerOrAdmin();
  const cleaned = urls.filter(Boolean).slice(0, 2);
  const { error } = await supabase.from("organizations").update({ invoice_extra_logo_urls: cleaned }).eq("id", organizationId);
  if (error) throw error;
  revalidatePath("/dashboard/instellingen");
}

/**
 * Write-only vanuit de client: deze actie geeft de sleutel nooit terug, en
 * de instellingenpagina selecteert 'm nooit in een query die richting een
 * client-component gaat -- alleen een server-side gemaskeerde weergavestring
 * (zie instellingen/page.tsx). De echte waarde wordt uitsluitend gelezen
 * door server-only code die 'm daadwerkelijk gebruikt (betaallink aanmaken,
 * de webhook).
 */
export async function updateMollieApiKey(rawKey: string) {
  const { supabase, organizationId } = await requireOwnerOrAdmin();
  const trimmed = rawKey.trim();
  if (!trimmed) throw new Error("Vul een geldige API-sleutel in.");
  const { error } = await supabase.from("organizations").update({ mollie_api_key: trimmed }).eq("id", organizationId);
  if (error) throw error;
  revalidatePath("/dashboard/instellingen");
}

export async function clearMollieApiKey() {
  const { supabase, organizationId } = await requireOwnerOrAdmin();
  const { error } = await supabase.from("organizations").update({ mollie_api_key: null }).eq("id", organizationId);
  if (error) throw error;
  revalidatePath("/dashboard/instellingen");
}

/** Leeg veld = de ingebouwde standaardtekst blijft gelden (zie
 * `invoiceSentClientEmail`/`invoiceOverdueReminderEmail`). */
export async function updateInvoiceEmailTemplates(fields: {
  sentSubject: string;
  sentBody: string;
  reminderSubject: string;
  reminderBody: string;
}) {
  const { supabase, organizationId } = await requireOwnerOrAdmin();
  const { error } = await supabase
    .from("organizations")
    .update({
      invoice_sent_email_subject: fields.sentSubject.trim() || null,
      invoice_sent_email_body: fields.sentBody.trim() || null,
      invoice_reminder_email_subject: fields.reminderSubject.trim() || null,
      invoice_reminder_email_body: fields.reminderBody.trim() || null,
    })
    .eq("id", organizationId);
  if (error) throw error;
  revalidatePath("/dashboard/instellingen");
}
