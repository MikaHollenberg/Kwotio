import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import { resolvePreferredLogo, toAbsoluteLogoUrl } from "@/lib/organization/logo";
import { resolveAccentColor, DEFAULT_ACCENT_COLOR } from "@/lib/organization/theme";
import { INVOICE_TYPE_LABELS } from "@/lib/invoicing/status";
import type { InvoicePdfData, InvoicePdfLine } from "./invoice-document";

/**
 * Bouwt de volledige `InvoicePdfData` voor een factuur -- gedeeld tussen de
 * download-route en de "verstuur factuur"-actie zodat er maar één plek is
 * die de gesnapshotte factuurgegevens naar het PDF-datamodel vertaalt.
 */
export async function buildInvoicePdfData(
  supabase: SupabaseClient<Database>,
  invoiceId: string,
  origin: string,
): Promise<InvoicePdfData | null> {
  const { data: invoice } = await supabase
    .from("invoices")
    .select(
      "id, organization_id, type, invoice_number, invoice_date, due_date, delivery_date, org_name, org_address, org_btw_number, org_kvk_number, org_iban, client_name, client_company, client_address, client_email, client_id, subtotal_excl_vat, vat_amount, total_incl_vat, deposit_basis_percentage, deposit_basis_amount, deposit_invoice_id, credit_for_invoice_id, mollie_payment_id",
    )
    .eq("id", invoiceId)
    .maybeSingle();
  if (!invoice) return null;

  const [{ data: lines }, { data: organization }, { data: client }] = await Promise.all([
    supabase
      .from("invoice_lines")
      .select("description, quantity, unit_price, vat_rate, vat_amount, line_total")
      .eq("invoice_id", invoiceId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("organizations")
      .select("logo_horizontal_url, logo_square_url, logo_preference, brand_theme, terms_url, invoice_extra_logo_urls")
      .eq("id", invoice.organization_id)
      .single(),
    invoice.client_id
      ? supabase.from("clients").select("client_number").eq("id", invoice.client_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const logoUrls = [
    organization ? resolvePreferredLogo(organization) : null,
    ...(organization?.invoice_extra_logo_urls ?? []),
  ]
    .map((url) => toAbsoluteLogoUrl(url, origin))
    .filter((url): url is string => Boolean(url));

  const invoiceLines: InvoicePdfLine[] = (lines ?? []).map((l) => ({
    description: l.description,
    quantity: Number(l.quantity),
    unitPrice: Number(l.unit_price),
    vatRate: Number(l.vat_rate),
    vatAmount: Number(l.vat_amount),
    lineTotal: Number(l.line_total),
  }));

  let depositSummary: InvoicePdfData["depositSummary"] = null;
  if (invoice.type === "slotfactuur" && invoice.deposit_invoice_id) {
    const { data: depositInvoice } = await supabase
      .from("invoices")
      .select("invoice_number, subtotal_excl_vat, vat_amount, total_incl_vat")
      .eq("id", invoice.deposit_invoice_id)
      .maybeSingle();
    if (depositInvoice) {
      depositSummary = {
        depositInvoiceNumber: depositInvoice.invoice_number,
        depositExclVat: Number(depositInvoice.subtotal_excl_vat),
        depositVat: Number(depositInvoice.vat_amount),
        depositInclVat: Number(depositInvoice.total_incl_vat),
      };
    }
  }

  let creditForInvoiceNumber: string | null = null;
  if (invoice.type === "creditnota" && invoice.credit_for_invoice_id) {
    const { data: creditedInvoice } = await supabase
      .from("invoices")
      .select("invoice_number")
      .eq("id", invoice.credit_for_invoice_id)
      .maybeSingle();
    creditForInvoiceNumber = creditedInvoice?.invoice_number ?? null;
  }

  return {
    accentColor: organization ? resolveAccentColor(organization) : DEFAULT_ACCENT_COLOR,
    logoUrls,
    organizationName: invoice.org_name,
    organizationAddress: invoice.org_address as { street?: string; postalCode?: string; city?: string } | null,
    organizationKvk: invoice.org_kvk_number,
    organizationBtw: invoice.org_btw_number,
    organizationIban: invoice.org_iban,
    invoiceNumber: invoice.invoice_number,
    invoiceTypeLabel: INVOICE_TYPE_LABELS[invoice.type],
    invoiceDate: invoice.invoice_date,
    dueDate: invoice.due_date,
    deliveryDate: invoice.delivery_date,
    clientName: invoice.client_name,
    clientCompany: invoice.client_company,
    clientAddress: invoice.client_address as { street?: string; postalCode?: string; city?: string } | null,
    clientEmail: invoice.client_email,
    clientNumber: client?.client_number ?? null,
    lines: invoiceLines,
    subtotalExclVat: Number(invoice.subtotal_excl_vat),
    vatAmount: Number(invoice.vat_amount),
    totalInclVat: Number(invoice.total_incl_vat),
    currency: "EUR",
    creditForInvoiceNumber,
    depositSummary,
    termsUrl: organization?.terms_url ?? null,
    generatedAt: new Date().toISOString(),
  };
}
