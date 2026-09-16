"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, InvoicePaymentMethod } from "@/lib/types/database";
import { buildInvoiceLinesFromQuote, type InvoiceLineDraft } from "@/lib/invoicing/line-items";
import { sumInvoiceLines, calculateInvoiceLineFromExcl } from "@/lib/invoicing/vat";
import { getNextInvoiceNumber } from "@/lib/invoicing/numbering";
import { calculateDepositAmount, type DepositMode } from "@/lib/invoicing/deposit";
import { INVOICE_TYPE_LABELS } from "@/lib/invoicing/status";
import { buildInvoicePdfData } from "@/lib/invoice-pdf/build-invoice-pdf-data";
import { renderInvoicePdf } from "@/lib/invoice-pdf/invoice-document";
import { sendEmail } from "@/lib/email/client";
import { invoiceSentClientEmail } from "@/lib/email/templates/invoicing";
import { renderEmailTemplate } from "@/lib/email/template-vars";
import { PRIVACYBELEID_URL } from "@/lib/legal";
import { getMollieClient, toMollieAmount } from "@/lib/invoicing/mollie";
import { formatCurrency, formatDate } from "@/lib/utils";

/** Facturen raken geld -- strenger dan de gebruikelijke "!= 'readonly'"-regel
 * van offertes/klanten, zelfde lijn als Instellingen/Statistieken. Matcht de
 * RLS-policies uit migratie 0048/0049 (owner/admin-only insert/update). */
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
    throw new Error("Alleen eigenaren en admins mogen facturen aanmaken of wijzigen.");
  }

  return { supabase, organizationId: profile.organization_id, userId: user.id };
}

/** Een teamlid mag facturen aanmaken (zelfde niveau als offertes/klanten),
 * maar niet bewerken, versturen, betalingen registreren of slotfacturen
 * genereren -- dat blijft owner/admin (zie `requireOwnerOrAdmin` hierboven).
 * Matcht de "owner/admin/member can insert"-RLS-policies uit migratie 0060. */
async function requireCanCreateInvoice() {
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
  if (profile.role === "readonly") {
    throw new Error("Alleen-lezen accounts mogen geen facturen aanmaken.");
  }

  return { supabase, organizationId: profile.organization_id, userId: user.id };
}

async function insertInvoiceLines(
  supabase: SupabaseClient<Database>,
  invoiceId: string,
  lines: InvoiceLineDraft[],
) {
  const { error } = await supabase.from("invoice_lines").insert(
    lines.map((line, index) => ({
      invoice_id: invoiceId,
      description: line.description,
      quantity: line.quantity,
      unit_price: line.unitPriceExclVat,
      vat_rate: line.vatRate,
      vat_amount: line.vatAmount,
      line_total: line.lineTotalInclVat,
      sort_order: index,
      source_package_id: line.sourcePackageId,
      source_addon_id: line.sourceAddonId,
    })),
  );
  if (error) throw error;
}

/**
 * Maakt (of hergebruikt) een Mollie-betaallink voor deze factuur, als de
 * organisatie een Mollie-sleutel heeft ingesteld. Faalt nooit hard -- een
 * organisatie zonder Mollie-koppeling (of een tijdelijke Mollie-storing)
 * valt gewoon terug op de IBAN-betaalgegevens die toch al op elke factuur
 * staan (zie de PDF/e-mail-template). Leest de sleutel uitsluitend hier,
 * server-only, en geeft 'm nooit terug -- alleen de checkout-URL.
 */
async function ensureMolliePaymentLink(
  supabase: SupabaseClient<Database>,
  invoiceId: string,
  organizationId: string,
  origin: string,
): Promise<{ paymentUrl: string; qrCodeDataUri: string } | null> {
  const { data: organization } = await supabase
    .from("organizations")
    .select("mollie_api_key")
    .eq("id", organizationId)
    .maybeSingle();
  if (!organization?.mollie_api_key) return null;

  const { data: invoice } = await supabase
    .from("invoices")
    .select("invoice_number, total_incl_vat, mollie_payment_id")
    .eq("id", invoiceId)
    .maybeSingle();
  if (!invoice) return null;

  try {
    const mollie = getMollieClient(organization.mollie_api_key);
    let checkoutUrl: string | undefined;

    // Bestaande, nog openstaande betaling hergebruiken i.p.v. bij elke
    // "verstuur"/"maak link"-actie een nieuwe Mollie-betaling aan te maken.
    if (invoice.mollie_payment_id) {
      const existing = await mollie.payments.get(invoice.mollie_payment_id);
      checkoutUrl = existing.getCheckoutUrl() ?? undefined;
    }

    if (!checkoutUrl) {
      const payment = await mollie.payments.create({
        amount: { currency: "EUR", value: toMollieAmount(Number(invoice.total_incl_vat)) },
        description: `Factuur ${invoice.invoice_number}`,
        redirectUrl: `${origin}/dashboard/facturen/${invoiceId}`,
        webhookUrl: `${origin}/api/webhooks/mollie`,
        metadata: { invoiceId },
      });
      checkoutUrl = payment.getCheckoutUrl() ?? undefined;
      if (checkoutUrl) {
        await supabase
          .from("invoices")
          .update({ mollie_payment_id: payment.id, mollie_payment_status: payment.status })
          .eq("id", invoiceId);
      }
    }

    if (!checkoutUrl) return null;
    const qrCodeDataUri = await QRCode.toDataURL(checkoutUrl, { width: 200, margin: 1 });
    return { paymentUrl: checkoutUrl, qrCodeDataUri };
  } catch (mollieError) {
    console.error("[facturen] Mollie-betaallink aanmaken mislukt:", mollieError);
    return null;
  }
}

/**
 * Rendert de factuur-PDF en verstuurt 'm als bijlage naar het klant-
 * e-mailadres, zet status van concept -> open. Gedeeld tussen de handmatige
 * "verstuur factuur"-actie en het automatisch versturen direct bij aanmaken
 * (organizations.invoice_auto_send). `sendEmail()` zelf faalt nooit hard bij
 * een ontbrekende `RESEND_API_KEY` -- de status wordt hoe dan ook
 * bijgewerkt, de e-mail wordt in dat geval alleen stil overgeslagen (zelfde
 * contract als overal elders in dit project). Geen eigen autorisatiecheck
 * hier: de aanroeper is al via `requireOwnerOrAdmin()` gegaan.
 */
async function sendInvoiceEmail(supabase: SupabaseClient<Database>, invoiceId: string) {
  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("id, organization_id, type, invoice_number, total_incl_vat, due_date, client_email, client_name")
    .eq("id", invoiceId)
    .single();
  if (error) throw error;
  if (!invoice.client_email) {
    throw new Error("Deze factuur heeft geen klant-e-mailadres om naar te versturen.");
  }

  const { data: organization } = await supabase
    .from("organizations")
    .select("invoice_sent_email_subject, invoice_sent_email_body")
    .eq("id", invoice.organization_id)
    .maybeSingle();

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;

  const pdfData = await buildInvoicePdfData(supabase, invoiceId, origin);
  if (!pdfData) throw new Error("Kon de factuurgegevens niet laden.");

  const paymentLink = await ensureMolliePaymentLink(supabase, invoiceId, invoice.organization_id, origin);
  if (paymentLink) {
    pdfData.paymentUrl = paymentLink.paymentUrl;
    pdfData.qrCodeDataUri = paymentLink.qrCodeDataUri;
  }

  const pdfBuffer = await renderInvoicePdf(pdfData);

  const vars = {
    klantnaam: invoice.client_name,
    factuurnummer: invoice.invoice_number,
    bedrag: formatCurrency(Number(invoice.total_incl_vat)),
    vervaldatum: formatDate(invoice.due_date),
    factuurtype: INVOICE_TYPE_LABELS[invoice.type],
  };
  const subject = organization?.invoice_sent_email_subject
    ? renderEmailTemplate(organization.invoice_sent_email_subject, vars)
    : `${INVOICE_TYPE_LABELS[invoice.type]} ${invoice.invoice_number} van ${pdfData.organizationName}`;

  await sendEmail({
    to: invoice.client_email,
    subject,
    html: invoiceSentClientEmail({
      organizationName: pdfData.organizationName,
      invoiceNumber: invoice.invoice_number,
      invoiceTypeLabel: INVOICE_TYPE_LABELS[invoice.type],
      totalInclVat: Number(invoice.total_incl_vat),
      dueDate: invoice.due_date,
      termsUrl: pdfData.termsUrl ?? null,
      privacyUrl: `${origin}${PRIVACYBELEID_URL}`,
      customBodyText: organization?.invoice_sent_email_body
        ? renderEmailTemplate(organization.invoice_sent_email_body, vars)
        : null,
    }),
    attachments: [{ filename: `factuur-${invoice.invoice_number}.pdf`, content: pdfBuffer }],
  });

  const { error: updateError } = await supabase
    .from("invoices")
    .update({ status: "open", sent_at: new Date().toISOString() })
    .eq("id", invoiceId);
  if (updateError) throw updateError;
}

export type CreateInvoiceOptions =
  | { kind: "volledig" }
  | { kind: "aanbetaling"; mode: DepositMode; value: number };

/**
 * Zet een geaccepteerde offerte om in een factuur. Kopieert de regels vanuit
 * de daadwerkelijk gekozen pakketten/opties en snapshot alle wettelijk
 * verplichte partij-/bedraggegevens op het moment van aanmaken -- een
 * factuur leest nooit live uit quotes/organizations/clients, in
 * tegenstelling tot de offerte-PDF (zie migratie 0048).
 *
 * Bij een aanbetaling wordt geen 1-op-1-kopie van de offerteregels gemaakt
 * (de klant heeft nog geen recht op de losse producten, alleen op het
 * aanbetaalde bedrag) maar één regel "Aanbetaling voor [titel]" met de btw
 * al volledig berekend over het aanbetaalde bedrag zelf -- wettelijk
 * vereist voor een voorschotnota.
 */
export async function createInvoiceFromQuote(quoteId: string, options: CreateInvoiceOptions) {
  const { supabase, organizationId, userId } = await requireCanCreateInvoice();

  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .select(
      "id, organization_id, status, title, price_display, selected_packages, selected_addons, client_display_name, client_display_email, client_display_company",
    )
    .eq("id", quoteId)
    .single();
  if (quoteError) throw quoteError;
  if (quote.organization_id !== organizationId) {
    throw new Error("Deze offerte hoort niet bij jouw organisatie.");
  }
  if (quote.status !== "geaccepteerd") {
    throw new Error("Alleen een geaccepteerde offerte kan worden omgezet naar een factuur.");
  }

  const { data: organization, error: orgError } = await supabase
    .from("organizations")
    .select("name, address, btw_number, kvk_number, iban, invoice_vat_rate_high, invoice_due_days, invoice_auto_send")
    .eq("id", organizationId)
    .single();
  if (orgError) throw orgError;

  const vatRate = Number(organization.invoice_vat_rate_high);
  const lineDrafts = await buildInvoiceLinesFromQuote(
    supabase,
    {
      id: quote.id,
      price_display: quote.price_display,
      selected_packages: quote.selected_packages,
      selected_addons: quote.selected_addons,
    },
    vatRate,
  );
  if (lineDrafts.length === 0) {
    throw new Error("Deze offerte heeft geen gekozen pakketten of opties om te factureren.");
  }
  const totals = sumInvoiceLines(lineDrafts);

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + organization.invoice_due_days);

  const { invoiceNumber, invoiceYear } = await getNextInvoiceNumber(supabase, organizationId);

  const baseInvoiceRow = {
    organization_id: organizationId,
    quote_id: quote.id,
    invoice_number: invoiceNumber,
    invoice_year: invoiceYear,
    due_date: dueDate.toISOString().slice(0, 10),
    org_name: organization.name,
    org_address: (organization.address as Record<string, unknown>) ?? {},
    org_btw_number: organization.btw_number,
    org_kvk_number: organization.kvk_number,
    org_iban: organization.iban,
    client_name: quote.client_display_name ?? "",
    client_company: quote.client_display_company,
    client_email: quote.client_display_email,
    created_by: userId,
  };

  let invoiceId: string;

  if (options.kind === "volledig") {
    const { data: invoice, error } = await supabase
      .from("invoices")
      .insert({
        ...baseInvoiceRow,
        type: "standaard",
        subtotal_excl_vat: totals.subtotalExclVat,
        vat_amount: totals.vatAmount,
        total_incl_vat: totals.totalInclVat,
      })
      .select("id")
      .single();
    if (error) throw error;
    invoiceId = invoice.id;
    await insertInvoiceLines(supabase, invoiceId, lineDrafts);
  } else {
    const deposit = calculateDepositAmount({
      orderTotalInclVat: totals.totalInclVat,
      vatRate,
      mode: options.mode,
      value: options.value,
    });

    const { data: invoice, error } = await supabase
      .from("invoices")
      .insert({
        ...baseInvoiceRow,
        type: "aanbetaling",
        subtotal_excl_vat: deposit.depositExclVat,
        vat_amount: deposit.depositVat,
        total_incl_vat: deposit.depositInclVat,
        deposit_basis_percentage: options.mode === "percentage" ? options.value : null,
        deposit_basis_amount: totals.totalInclVat,
        deposit_basis_lines:
          options.mode === "percentage"
            ? lineDrafts.map((d) => ({
                description: d.description,
                quantity: d.quantity,
                unitPrice: d.unitPriceExclVat,
                vatRate: d.vatRate,
              }))
            : null,
      })
      .select("id")
      .single();
    if (error) throw error;
    invoiceId = invoice.id;

    const depositLabel =
      options.mode === "percentage"
        ? `Aanbetaling voor "${quote.title}", ${options.value}%`
        : `Aanbetaling voor "${quote.title}"`;

    await insertInvoiceLines(supabase, invoiceId, [
      {
        description: depositLabel,
        quantity: 1,
        unitPriceExclVat: deposit.depositExclVat,
        vatRate,
        vatAmount: deposit.depositVat,
        lineTotalInclVat: deposit.depositInclVat,
        sourcePackageId: null,
        sourceAddonId: null,
      },
    ]);
  }

  // Automatisch versturen als de organisatie dat zo heeft ingesteld
  // (standaard uit -- handmatige bevestiging is de veiligere default bij
  // iets wat geld raakt). Een fout hierin mag de net-aangemaakte factuur
  // niet ongedaan maken -- de gebruiker kan 'm dan alsnog handmatig
  // versturen vanaf de factuurpagina.
  if (organization.invoice_auto_send) {
    try {
      await sendInvoiceEmail(supabase, invoiceId);
    } catch (sendError) {
      console.error("[facturen] Automatisch versturen mislukt:", sendError);
    }
  }

  revalidatePath("/dashboard/facturen");
  revalidatePath(`/dashboard/offertes/${quoteId}`);
  redirect(`/dashboard/facturen/${invoiceId}`);
}

export async function sendInvoice(invoiceId: string) {
  const { supabase, organizationId } = await requireOwnerOrAdmin();

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("organization_id")
    .eq("id", invoiceId)
    .single();
  if (error) throw error;
  if (invoice.organization_id !== organizationId) throw new Error("Deze factuur hoort niet bij jouw organisatie.");

  await sendInvoiceEmail(supabase, invoiceId);

  revalidatePath(`/dashboard/facturen/${invoiceId}`);
  revalidatePath("/dashboard/facturen");
}

/**
 * Handmatig markeren als betaald -- zet `payment_method` op de gekozen
 * methode (overboeking/pin/contant/sponsoring/overig, zie
 * `MANUAL_PAYMENT_METHODS`), expliciet onderscheidbaar van een Mollie-
 * bevestigde betaling voor latere rapportage. Bij een aanbetalingsfactuur
 * wordt de "aanbetaald"-cache op de onderliggende offerte in dezelfde
 * beweging bijgewerkt (zie migratie 0050) -- dat gebeurt hier én in de
 * toekomstige Mollie-webhook, nooit los.
 */
export async function markInvoicePaid(
  invoiceId: string,
  input: { paidDate: string; note: string; method: Exclude<InvoicePaymentMethod, "mollie"> },
) {
  const { supabase, organizationId } = await requireOwnerOrAdmin();

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("organization_id, type, quote_id, total_incl_vat")
    .eq("id", invoiceId)
    .single();
  if (error) throw error;
  if (invoice.organization_id !== organizationId) throw new Error("Deze factuur hoort niet bij jouw organisatie.");

  const paidAt = new Date(`${input.paidDate}T12:00:00`).toISOString();

  const { error: updateError } = await supabase
    .from("invoices")
    .update({
      status: "betaald",
      payment_method: input.method,
      paid_at: paidAt,
      paid_note: input.note.trim() || null,
    })
    .eq("id", invoiceId);
  if (updateError) throw updateError;

  // Alleen bij een offerte-gebonden aanbetaling -- een losse factuur (zonder
  // offerte) heeft geen quotes-rij om de "aanbetaald"-cache op bij te werken.
  if (invoice.type === "aanbetaling" && invoice.quote_id) {
    const { error: quoteError } = await supabase
      .from("quotes")
      .update({
        deposit_invoice_id: invoiceId,
        deposit_amount: invoice.total_incl_vat,
        deposit_paid_at: paidAt,
      })
      .eq("id", invoice.quote_id);
    if (quoteError) throw quoteError;
  }

  revalidatePath(`/dashboard/facturen/${invoiceId}`);
  revalidatePath("/dashboard/facturen");
  if (invoice.quote_id) revalidatePath(`/dashboard/offertes/${invoice.quote_id}`);
}

/**
 * Genereert de slotfactuur zodra de aanbetaling betaald is. Gaat uit van de
 * AANBETALINGSFACTUUR zelf (niet een offerte -- werkt zo identiek voor een
 * offerte-gebonden én een losse aanbetaling), maar bouwt de regels VANAF 0
 * op met de daadwerkelijke, definitieve bestelling (zie
 * `SlotfactuurForm`/`getSlotfactuurSeed`) -- bewust GEEN automatische
 * "restbedrag = geschatte orderwaarde min aanbetaling"-berekening meer.
 * Die geschatte-orderwaarde-aanpak brak zodra de uiteindelijke bestelling
 * afweek van de schatting bij het aanmaken van de aanbetaling (bv. een
 * vaste aanbetaling die niets met het aantal gasten te maken heeft, en
 * uiteindelijk komen er minder/meer gasten dan verwacht) -- de aanbetaling
 * zelf staat immers al vast, los van wat er uiteindelijk op de slotfactuur
 * komt. De aanroeper (het formulier) neemt zelf een negatieve regel
 * "Aanbetaling reeds voldaan" op in `lines`, zodat de btw-samenvatting
 * gewoon via de normale regel-optelling klopt, ook bij gemengde
 * btw-tarieven. Bewust een handmatige actie (geen automatische trigger op
 * event_date) -- het personeel bepaalt zelf wanneer de dienst is afgerond.
 */
export async function createSlotfactuurFromLines(depositInvoiceId: string, lines: InvoiceLineInput[]) {
  const { supabase, organizationId, userId } = await requireOwnerOrAdmin();
  if (lines.length === 0) throw new Error("Voeg minstens één regel toe.");

  const { data: depositInvoice, error: depositError } = await supabase
    .from("invoices")
    .select("id, organization_id, type, quote_id, client_id, client_name, client_company, client_email, invoice_number, paid_at")
    .eq("id", depositInvoiceId)
    .single();
  if (depositError) throw depositError;
  if (depositInvoice.organization_id !== organizationId) {
    throw new Error("Deze factuur hoort niet bij jouw organisatie.");
  }
  if (depositInvoice.type !== "aanbetaling") throw new Error("Dit is geen aanbetalingsfactuur.");
  if (!depositInvoice.paid_at) throw new Error("De aanbetaling is nog niet betaald.");

  const { count: existingSlotfactuurCount } = await supabase
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .eq("deposit_invoice_id", depositInvoiceId)
    .eq("type", "slotfactuur");
  if ((existingSlotfactuurCount ?? 0) > 0) {
    throw new Error("Er bestaat al een slotfactuur voor deze aanbetaling.");
  }

  const { data: organization, error: orgError } = await supabase
    .from("organizations")
    .select("name, address, btw_number, kvk_number, iban, invoice_due_days")
    .eq("id", organizationId)
    .single();
  if (orgError) throw orgError;

  const lineAmounts = lines.map((line) =>
    calculateInvoiceLineFromExcl({ quantity: line.quantity, unitPriceExclVat: line.unitPrice, vatRate: line.vatRate }),
  );
  const totals = sumInvoiceLines(
    lines.map((line, i) => ({
      unitPriceExclVat: line.unitPrice,
      quantity: line.quantity,
      vatAmount: lineAmounts[i].vatAmount,
      lineTotalInclVat: lineAmounts[i].lineTotalInclVat,
    })),
  );

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + organization.invoice_due_days);

  const { invoiceNumber, invoiceYear } = await getNextInvoiceNumber(supabase, organizationId);

  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      organization_id: organizationId,
      quote_id: depositInvoice.quote_id,
      client_id: depositInvoice.client_id,
      deposit_invoice_id: depositInvoice.id,
      type: "slotfactuur",
      invoice_number: invoiceNumber,
      invoice_year: invoiceYear,
      due_date: dueDate.toISOString().slice(0, 10),
      org_name: organization.name,
      org_address: (organization.address as Record<string, unknown>) ?? {},
      org_btw_number: organization.btw_number,
      org_kvk_number: organization.kvk_number,
      org_iban: organization.iban,
      client_name: depositInvoice.client_name,
      client_company: depositInvoice.client_company,
      client_email: depositInvoice.client_email,
      subtotal_excl_vat: totals.subtotalExclVat,
      vat_amount: totals.vatAmount,
      total_incl_vat: totals.totalInclVat,
      created_by: userId,
    })
    .select("id")
    .single();
  if (error) throw error;

  await insertInvoiceLines(
    supabase,
    invoice.id,
    lines.map((line, i) => ({
      description: line.description,
      quantity: line.quantity,
      unitPriceExclVat: line.unitPrice,
      vatRate: line.vatRate,
      vatAmount: lineAmounts[i].vatAmount,
      lineTotalInclVat: lineAmounts[i].lineTotalInclVat,
      sourcePackageId: null,
      sourceAddonId: null,
    })),
  );

  revalidatePath("/dashboard/facturen");
  revalidatePath(`/dashboard/facturen/${depositInvoiceId}`);
  if (depositInvoice.quote_id) revalidatePath(`/dashboard/offertes/${depositInvoice.quote_id}`);
  redirect(`/dashboard/facturen/${invoice.id}`);
}

/**
 * Handmatig een Mollie-betaallink (opnieuw) aanmaken voor deze factuur --
 * bv. als de factuur al bestond voordat de organisatie Mollie koppelde.
 * Geeft alleen de checkout-URL terug (nooit de API-sleutel).
 */
export async function createMolliePaymentLink(invoiceId: string): Promise<string> {
  const { supabase, organizationId } = await requireOwnerOrAdmin();

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("organization_id")
    .eq("id", invoiceId)
    .single();
  if (error) throw error;
  if (invoice.organization_id !== organizationId) throw new Error("Deze factuur hoort niet bij jouw organisatie.");

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;

  const link = await ensureMolliePaymentLink(supabase, invoiceId, organizationId, origin);
  if (!link) {
    throw new Error("Kon geen Mollie-betaallink aanmaken — controleer de API-sleutel bij Instellingen → Facturatie.");
  }

  revalidatePath(`/dashboard/facturen/${invoiceId}`);
  return link.paymentUrl;
}

export type InvoiceLineInput = {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  catalogItemId: string | null;
};

/**
 * Vervangt alle regels van een conceptfactuur (en herberekent de totalen) --
 * bv. een correctie, of het vrij samenstellen van een losse factuur na
 * aanmaken. Alleen toegestaan zolang de factuur nog `concept` is; eenmaal
 * verstuurd/betaald wordt een factuur niet meer aangeboden om te bewerken,
 * zelfde onveranderlijkheidsfilosofie als de rest van de module.
 *
 * Voegt de nieuwe regels eerst toe en verwijdert de oude pas daarna (i.p.v.
 * eerst verwijderen) -- zo blijft de factuur bij een falende insert altijd
 * consistent met zijn vorige regels i.p.v. tijdelijk leeg te staan.
 */
export async function updateInvoiceLines(invoiceId: string, lines: InvoiceLineInput[]) {
  const { supabase, organizationId } = await requireOwnerOrAdmin();

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("organization_id, status")
    .eq("id", invoiceId)
    .single();
  if (error) throw error;
  if (invoice.organization_id !== organizationId) throw new Error("Deze factuur hoort niet bij jouw organisatie.");
  if (invoice.status !== "concept") throw new Error("Alleen een conceptfactuur kan nog bewerkt worden.");
  if (lines.length === 0) throw new Error("Een factuur moet minstens één regel hebben.");

  const { data: oldLines, error: oldLinesError } = await supabase
    .from("invoice_lines")
    .select("id")
    .eq("invoice_id", invoiceId);
  if (oldLinesError) throw oldLinesError;

  const amounts = lines.map((line) =>
    calculateInvoiceLineFromExcl({ quantity: line.quantity, unitPriceExclVat: line.unitPrice, vatRate: line.vatRate }),
  );
  const totals = sumInvoiceLines(
    lines.map((line, i) => ({
      unitPriceExclVat: line.unitPrice,
      quantity: line.quantity,
      vatAmount: amounts[i].vatAmount,
      lineTotalInclVat: amounts[i].lineTotalInclVat,
    })),
  );

  const { error: insertError } = await supabase.from("invoice_lines").insert(
    lines.map((line, index) => ({
      invoice_id: invoiceId,
      description: line.description,
      quantity: line.quantity,
      unit_price: line.unitPrice,
      vat_rate: line.vatRate,
      vat_amount: amounts[index].vatAmount,
      line_total: amounts[index].lineTotalInclVat,
      sort_order: index,
      source_catalog_item_id: line.catalogItemId,
    })),
  );
  if (insertError) throw insertError;

  if (oldLines && oldLines.length > 0) {
    const { error: deleteError } = await supabase
      .from("invoice_lines")
      .delete()
      .in("id", oldLines.map((l) => l.id));
    if (deleteError) throw deleteError;
  }

  const { error: updateError } = await supabase
    .from("invoices")
    .update({
      subtotal_excl_vat: totals.subtotalExclVat,
      vat_amount: totals.vatAmount,
      total_incl_vat: totals.totalInclVat,
    })
    .eq("id", invoiceId);
  if (updateError) throw updateError;

  revalidatePath(`/dashboard/facturen/${invoiceId}`);
  revalidatePath("/dashboard/facturen");
}

/**
 * Verwijdert een factuur -- uitsluitend zolang die nog 'concept' is (nooit
 * verstuurd/betaald). Een verstuurde/betaalde factuur heeft een wettelijk
 * doorlopend factuurnummer; die verwijderen zou een gat in de nummerreeks
 * veroorzaken, dus dat blijft bewust onmogelijk (ook op RLS-niveau, zie
 * migratie 0062 -- deze check hier is voor een duidelijke foutmelding,
 * niet de enige beveiliging). `invoice_lines` cascadet automatisch mee.
 */
export async function deleteInvoice(invoiceId: string) {
  const { supabase, organizationId } = await requireOwnerOrAdmin();

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("organization_id, status")
    .eq("id", invoiceId)
    .single();
  if (error) throw error;
  if (invoice.organization_id !== organizationId) throw new Error("Deze factuur hoort niet bij jouw organisatie.");
  if (invoice.status !== "concept") {
    throw new Error("Alleen een conceptfactuur (nog niet verstuurd) kan verwijderd worden.");
  }

  const { error: deleteError } = await supabase.from("invoices").delete().eq("id", invoiceId);
  if (deleteError) throw deleteError;

  revalidatePath("/dashboard/facturen");
}

/**
 * Maakt een volledige creditnota voor een al verstuurde/betaalde factuur --
 * de oplossing voor "verkeerde factuur is al de deur uit" nu verwijderen
 * niet meer kan (zie `deleteInvoice`). Kopieert alle regels met omgekeerd
 * teken (alleen volledig crediteren, geen deel-editor -- bewuste
 * scope-keuze), krijgt een eigen nummer uit dezelfde doorlopende reeks, en
 * blijft zelf een concept totdat 'm expliciet wordt verstuurd (zelfde
 * "eerst zelf checken"-patroon als elke andere nieuwe factuur).
 */
export async function createCreditNote(invoiceId: string) {
  const { supabase, organizationId, userId } = await requireOwnerOrAdmin();

  const { data: original, error } = await supabase
    .from("invoices")
    .select(
      "id, organization_id, type, status, quote_id, client_id, org_name, org_address, org_btw_number, org_kvk_number, org_iban, client_name, client_company, client_address, client_email, subtotal_excl_vat, vat_amount, total_incl_vat, invoice_number",
    )
    .eq("id", invoiceId)
    .single();
  if (error) throw error;
  if (original.organization_id !== organizationId) throw new Error("Deze factuur hoort niet bij jouw organisatie.");
  if (original.type === "creditnota") throw new Error("Een creditnota kan niet zelf gecrediteerd worden.");
  if (original.status === "concept") {
    throw new Error("Een conceptfactuur is nog niet verstuurd -- verwijder 'm in plaats van te crediteren.");
  }
  if (original.status === "geannuleerd") throw new Error("Een geannuleerde factuur hoeft niet gecrediteerd te worden.");

  const { count: existingCreditCount } = await supabase
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .eq("credit_for_invoice_id", invoiceId);
  if ((existingCreditCount ?? 0) > 0) {
    throw new Error("Er bestaat al een creditnota voor deze factuur.");
  }

  const { data: originalLines, error: linesError } = await supabase
    .from("invoice_lines")
    .select("description, quantity, unit_price, vat_rate, vat_amount, line_total, sort_order, source_package_id, source_addon_id, source_catalog_item_id")
    .eq("invoice_id", invoiceId)
    .order("sort_order", { ascending: true });
  if (linesError) throw linesError;

  const today = new Date().toISOString().slice(0, 10);
  const { invoiceNumber, invoiceYear } = await getNextInvoiceNumber(supabase, organizationId);

  const { data: creditNote, error: insertError } = await supabase
    .from("invoices")
    .insert({
      organization_id: organizationId,
      quote_id: original.quote_id,
      client_id: original.client_id,
      credit_for_invoice_id: original.id,
      type: "creditnota",
      invoice_number: invoiceNumber,
      invoice_year: invoiceYear,
      due_date: today,
      org_name: original.org_name,
      org_address: original.org_address,
      org_btw_number: original.org_btw_number,
      org_kvk_number: original.org_kvk_number,
      org_iban: original.org_iban,
      client_name: original.client_name,
      client_company: original.client_company,
      client_address: original.client_address,
      client_email: original.client_email,
      subtotal_excl_vat: -Number(original.subtotal_excl_vat),
      vat_amount: -Number(original.vat_amount),
      total_incl_vat: -Number(original.total_incl_vat),
      created_by: userId,
    })
    .select("id")
    .single();
  if (insertError) throw insertError;

  if (originalLines && originalLines.length > 0) {
    const { error: creditLinesError } = await supabase.from("invoice_lines").insert(
      originalLines.map((line) => ({
        invoice_id: creditNote.id,
        description: line.description,
        quantity: line.quantity,
        unit_price: -Number(line.unit_price),
        vat_rate: line.vat_rate,
        vat_amount: -Number(line.vat_amount),
        line_total: -Number(line.line_total),
        sort_order: line.sort_order,
        source_package_id: line.source_package_id,
        source_addon_id: line.source_addon_id,
        source_catalog_item_id: line.source_catalog_item_id,
      })),
    );
    if (creditLinesError) throw creditLinesError;
  }

  revalidatePath("/dashboard/facturen");
  revalidatePath(`/dashboard/facturen/${invoiceId}`);
  redirect(`/dashboard/facturen/${creditNote.id}`);
}

export type StandaloneClientInput =
  | { kind: "existing"; clientId: string }
  | {
      kind: "freeform";
      name: string;
      company: string | null;
      email: string | null;
      address: { street?: string; postalCode?: string; city?: string; country?: string } | null;
    };

export type CreateStandaloneInvoiceInput = {
  client: StandaloneClientInput;
  lines: InvoiceLineInput[];
  mode: "volledig" | "aanbetaling";
  /** Alleen bij mode "aanbetaling": vast bedrag/percentage van de op basis
   * van `lines` berekende ordertotaal, plus het btw-tarief dat specifiek
   * over het aanbetaalde bedrag zelf gerekend wordt -- bij een losse
   * factuur kunnen de onderliggende regels immers gemengde tarieven hebben
   * (hoog+laag door elkaar), dus de aanbetaling kiest zijn eigen tarief
   * i.p.v. automatisch één ervan over te nemen. */
  depositOption?: { depositMode: DepositMode; value: number; vatRate: number };
};

/**
 * "Vanaf 0"-factuur, zonder offerte. Klant is een bestaand CRM-record óf vrij
 * ingetypt (geen klantrecord verplicht voor een eenmalige factuur). Bij een
 * aanbetaling worden de ingevoerde regels alleen gebruikt om de ordertotaal
 * te berekenen (`deposit_basis_amount`) -- net als bij een offerte-
 * aanbetaling komt er één losse "Aanbetaling"-regel op de factuur, de
 * onderliggende regels zelf niet (die horen pas op de slotfactuur/een
 * volgende volledige factuur).
 */
export async function createStandaloneInvoice(input: CreateStandaloneInvoiceInput) {
  const { supabase, organizationId, userId } = await requireCanCreateInvoice();

  // Regels zijn alleen verplicht voor een volledige factuur of een
  // percentage-aanbetaling (die heeft een ordertotaal nodig om het
  // percentage van te berekenen). Een vast-bedrag-aanbetaling staat los van
  // enige ordertotaal-schatting -- de definitieve bestelling volgt sowieso
  // pas op de slotfactuur (zie `createSlotfactuurFromLines`).
  const isFixedDeposit = input.mode === "aanbetaling" && input.depositOption?.depositMode === "fixed";
  if (input.lines.length === 0 && !isFixedDeposit) throw new Error("Voeg minstens één regel toe.");

  let clientId: string | null = null;
  let clientName: string;
  let clientCompany: string | null = null;
  let clientEmail: string | null = null;
  let clientAddress: Record<string, unknown> | null = null;

  if (input.client.kind === "existing") {
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id, organization_id, name, email, company_name")
      .eq("id", input.client.clientId)
      .single();
    if (clientError) throw clientError;
    if (client.organization_id !== organizationId) throw new Error("Deze klant hoort niet bij jouw organisatie.");
    clientId = client.id;
    clientName = client.name;
    clientCompany = client.company_name;
    clientEmail = client.email;
  } else {
    if (!input.client.name.trim()) throw new Error("Vul een klantnaam in.");
    clientName = input.client.name.trim();
    clientCompany = input.client.company?.trim() || null;
    clientEmail = input.client.email?.trim() || null;
    clientAddress = input.client.address ?? null;
  }

  const { data: organization, error: orgError } = await supabase
    .from("organizations")
    .select("name, address, btw_number, kvk_number, iban, invoice_due_days, invoice_auto_send")
    .eq("id", organizationId)
    .single();
  if (orgError) throw orgError;

  const lineAmounts = input.lines.map((line) =>
    calculateInvoiceLineFromExcl({ quantity: line.quantity, unitPriceExclVat: line.unitPrice, vatRate: line.vatRate }),
  );
  const totals = sumInvoiceLines(
    input.lines.map((line, i) => ({
      unitPriceExclVat: line.unitPrice,
      quantity: line.quantity,
      vatAmount: lineAmounts[i].vatAmount,
      lineTotalInclVat: lineAmounts[i].lineTotalInclVat,
    })),
  );

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + organization.invoice_due_days);

  const { invoiceNumber, invoiceYear } = await getNextInvoiceNumber(supabase, organizationId);

  const baseInvoiceRow = {
    organization_id: organizationId,
    quote_id: null,
    client_id: clientId,
    invoice_number: invoiceNumber,
    invoice_year: invoiceYear,
    due_date: dueDate.toISOString().slice(0, 10),
    org_name: organization.name,
    org_address: (organization.address as Record<string, unknown>) ?? {},
    org_btw_number: organization.btw_number,
    org_kvk_number: organization.kvk_number,
    org_iban: organization.iban,
    client_name: clientName,
    client_company: clientCompany,
    client_email: clientEmail,
    client_address: clientAddress,
    created_by: userId,
  };

  let invoiceId: string;

  if (input.mode === "volledig") {
    const { data: invoice, error } = await supabase
      .from("invoices")
      .insert({
        ...baseInvoiceRow,
        type: "standaard",
        subtotal_excl_vat: totals.subtotalExclVat,
        vat_amount: totals.vatAmount,
        total_incl_vat: totals.totalInclVat,
      })
      .select("id")
      .single();
    if (error) throw error;
    invoiceId = invoice.id;

    await insertInvoiceLines(
      supabase,
      invoiceId,
      input.lines.map((line, i) => ({
        description: line.description,
        quantity: line.quantity,
        unitPriceExclVat: line.unitPrice,
        vatRate: line.vatRate,
        vatAmount: lineAmounts[i].vatAmount,
        lineTotalInclVat: lineAmounts[i].lineTotalInclVat,
        sourcePackageId: null,
        sourceAddonId: null,
      })),
    );
  } else {
    if (!input.depositOption) throw new Error("Vul een aanbetalingsbedrag of -percentage in.");

    const orderTotalInclVat = input.lines.length > 0 ? totals.totalInclVat : null;
    const deposit = calculateDepositAmount({
      orderTotalInclVat,
      vatRate: input.depositOption.vatRate,
      mode: input.depositOption.depositMode,
      value: input.depositOption.value,
    });

    const { data: invoice, error } = await supabase
      .from("invoices")
      .insert({
        ...baseInvoiceRow,
        type: "aanbetaling",
        subtotal_excl_vat: deposit.depositExclVat,
        vat_amount: deposit.depositVat,
        total_incl_vat: deposit.depositInclVat,
        deposit_basis_percentage: input.depositOption.depositMode === "percentage" ? input.depositOption.value : null,
        deposit_basis_amount: orderTotalInclVat,
        deposit_basis_lines:
          input.depositOption.depositMode === "percentage"
            ? input.lines.map((line) => ({
                description: line.description,
                quantity: line.quantity,
                unitPrice: line.unitPrice,
                vatRate: line.vatRate,
              }))
            : null,
      })
      .select("id")
      .single();
    if (error) throw error;
    invoiceId = invoice.id;

    const depositLabel =
      input.depositOption.depositMode === "percentage"
        ? `Aanbetaling, ${input.depositOption.value}%`
        : "Aanbetaling";

    await insertInvoiceLines(supabase, invoiceId, [
      {
        description: depositLabel,
        quantity: 1,
        unitPriceExclVat: deposit.depositExclVat,
        vatRate: input.depositOption.vatRate,
        vatAmount: deposit.depositVat,
        lineTotalInclVat: deposit.depositInclVat,
        sourcePackageId: null,
        sourceAddonId: null,
      },
    ]);
  }

  if (organization.invoice_auto_send) {
    try {
      await sendInvoiceEmail(supabase, invoiceId);
    } catch (sendError) {
      console.error("[facturen] Automatisch versturen mislukt:", sendError);
    }
  }

  revalidatePath("/dashboard/facturen");
  redirect(`/dashboard/facturen/${invoiceId}`);
}
