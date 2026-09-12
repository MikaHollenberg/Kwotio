"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email/client";
import { quoteRequestReceivedEmail } from "@/lib/email/templates/notifications";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_FILL_TIME_MS = 3000;

export type SubmitQuoteRequestInput = {
  orgSlug: string;
  templateId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCompany: string;
  guestCount: string;
  desiredDate: string;
  notes: string;
  /** Verborgen veld — moet leeg blijven. Ingevuld = waarschijnlijk een bot. */
  honeypot: string;
  /** epoch ms van het moment dat het formulier werd getoond. */
  formStartedAt: number;
};

export type SubmitQuoteRequestResult = { ok: true } | { ok: false; error: string };

/**
 * Publieke, niet-ingelogde server action — zelfde beveiligingsfilosofie als
 * app/src/app/offerte/[token]/actions.ts: nooit clientinput vertrouwen,
 * organisatie/template altijd opnieuw server-side opzoeken (nooit een
 * meegegeven organization_id gebruiken), service-role client want er is geen
 * sessie. `quote_requests` heeft bewust geen anon-insertpolicy — dit is de
 * enige plek waar zo'n rij ontstaat.
 */
export async function submitQuoteRequest(input: SubmitQuoteRequestInput): Promise<SubmitQuoteRequestResult> {
  // Ingevuld honeypot-veld = vrijwel zeker een bot. Doe alsof het gelukt is
  // (geen enkele hint teruggeven waarom het niet doorging).
  if (input.honeypot.trim() !== "") {
    return { ok: true };
  }

  if (Date.now() - input.formStartedAt < MIN_FILL_TIME_MS) {
    return { ok: false, error: "Even geduld — probeer het over een paar seconden opnieuw." };
  }

  const name = input.customerName.trim();
  const email = input.customerEmail.trim();
  const phone = input.customerPhone.trim();
  if (!name) return { ok: false, error: "Vul je naam in." };
  if (!input.templateId) return { ok: false, error: "Kies een template." };
  if (!email || !phone) return { ok: false, error: "Vul zowel een e-mailadres als telefoonnummer in." };
  if (!EMAIL_PATTERN.test(email)) return { ok: false, error: "Vul een geldig e-mailadres in." };

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "onbekend";
  const { allowed } = await checkRateLimit("quote_request_submit", ip, { max: 5, windowSeconds: 15 * 60 });
  if (!allowed) {
    return { ok: false, error: "Te veel aanvragen vanaf dit adres. Probeer het later opnieuw." };
  }

  const supabase = createAdminClient();

  const { data: organization } = await supabase
    .from("organizations")
    .select("id, brand_name, contact_email")
    .eq("public_slug", input.orgSlug)
    .is("archived_at", null)
    .maybeSingle();
  if (!organization) return { ok: false, error: "Deze pagina bestaat niet (meer)." };

  const { data: template } = await supabase
    .from("templates")
    .select("id, name")
    .eq("id", input.templateId)
    .eq("organization_id", organization.id)
    .eq("is_publicly_visible", true)
    .eq("is_active", true)
    .is("archived_at", null)
    .maybeSingle();
  if (!template) return { ok: false, error: "Dit template is niet meer beschikbaar. Ververs de pagina en probeer opnieuw." };

  const parsedGuestCount = Math.trunc(Number(input.guestCount));
  const guestCount = input.guestCount.trim() && Number.isFinite(parsedGuestCount) ? Math.max(0, parsedGuestCount) : null;

  const desiredDate = input.desiredDate || null;
  if (desiredDate) {
    const { data: closedDate } = await supabase
      .from("closed_dates")
      .select("id")
      .eq("organization_id", organization.id)
      .eq("date", desiredDate)
      .maybeSingle();
    if (closedDate) return { ok: false, error: "Op deze datum zijn we gesloten. Kies een andere datum." };
  }

  const { error } = await supabase.from("quote_requests").insert({
    organization_id: organization.id,
    template_id: template.id,
    customer_name: name,
    customer_email: email,
    customer_phone: phone,
    customer_company: input.customerCompany.trim() || null,
    guest_count: guestCount,
    desired_date: desiredDate,
    notes: input.notes.trim() || null,
  });
  if (error) return { ok: false, error: "Aanvraag versturen is mislukt. Probeer het opnieuw." };

  const notifyEmail = organization.contact_email;
  if (notifyEmail) {
    const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
    await sendEmail({
      to: notifyEmail,
      subject: `Nieuwe offerte-aanvraag van ${name}`,
      html: quoteRequestReceivedEmail({
        organizationName: organization.brand_name,
        customerName: name,
        templateName: template.name,
        dashboardUrl: `${origin}/dashboard/aanvragen`,
      }),
    });
  }

  return { ok: true };
}
