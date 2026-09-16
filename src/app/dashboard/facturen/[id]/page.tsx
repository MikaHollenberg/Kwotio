import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_TONES, INVOICE_TYPE_LABELS, INVOICE_PAYMENT_METHOD_LABELS } from "@/lib/invoicing/status";
import { InvoiceActionsBar } from "./invoice-actions-bar";
import { EditInvoiceLinesCard } from "./edit-invoice-lines-card";
import type { CatalogItemOption, EditableLine } from "@/components/invoicing/line-items-editor";

export default async function FactuurDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .eq("id", user!.id)
    .single();
  if (!profile) redirect("/dashboard");
  const canManageInvoice = profile.role === "owner" || profile.role === "admin";

  const { data: invoice } = await supabase
    .from("invoices")
    .select(
      "id, invoice_number, type, status, invoice_date, due_date, delivery_date, org_name, org_address, org_btw_number, org_kvk_number, org_iban, client_name, client_company, client_email, subtotal_excl_vat, vat_amount, total_incl_vat, deposit_basis_percentage, deposit_basis_amount, payment_method, paid_at, paid_note, quote_id, credit_for_invoice_id",
    )
    .eq("id", id)
    .maybeSingle();
  if (!invoice) notFound();

  const [{ data: lines }, { data: organization }, { count: slotfactuurCount }, { data: creditNoteRows }, { data: catalogItemRows }, { data: creditedInvoice }] =
    await Promise.all([
      supabase
        .from("invoice_lines")
        .select("id, description, quantity, unit_price, vat_rate, vat_amount, line_total, source_catalog_item_id")
        .eq("invoice_id", id)
        .order("sort_order", { ascending: true }),
      supabase
        .from("organizations")
        .select("mollie_api_key, invoice_vat_rate_high, invoice_vat_rate_low")
        .eq("id", profile.organization_id)
        .maybeSingle(),
      supabase
        .from("invoices")
        .select("id", { count: "exact", head: true })
        .eq("deposit_invoice_id", id)
        .eq("type", "slotfactuur"),
      supabase.from("invoices").select("id, invoice_number").eq("credit_for_invoice_id", id).limit(1),
      supabase
        .from("invoice_catalog_items")
        .select("id, name, description, unit_price, vat_rate_type, vat_rate_custom")
        .is("archived_at", null)
        .order("name", { ascending: true }),
      invoice.credit_for_invoice_id
        ? supabase.from("invoices").select("id, invoice_number").eq("id", invoice.credit_for_invoice_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
  const creditNote = creditNoteRows?.[0] ?? null;

  const orgAddress = invoice.org_address as { street?: string; postalCode?: string; city?: string } | null;
  const vatRates = { hoog: organization?.invoice_vat_rate_high ?? 21, laag: organization?.invoice_vat_rate_low ?? 9 };
  const catalogItems: CatalogItemOption[] = (catalogItemRows ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    unitPrice: Number(c.unit_price),
    vatRateType: c.vat_rate_type,
    vatRateCustom: c.vat_rate_custom != null ? Number(c.vat_rate_custom) : null,
  }));

  function vatRateToType(rate: number): "hoog" | "laag" | "nul" | "aangepast" {
    if (rate === vatRates.hoog) return "hoog";
    if (rate === vatRates.laag) return "laag";
    if (rate === 0) return "nul";
    return "aangepast";
  }

  const editableLines: EditableLine[] = (lines ?? []).map((l) => {
    const vatRate = Number(l.vat_rate);
    const vatRateType = vatRateToType(vatRate);
    return {
      key: l.id,
      description: l.description,
      quantity: Number(l.quantity),
      unitPrice: Number(l.unit_price),
      vatRateType,
      vatRateCustom: vatRateType === "aangepast" ? vatRate : 0,
      catalogItemId: l.source_catalog_item_id,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <Link href="/dashboard/facturen" className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-500">
        <ArrowLeft className="size-4" />
        Terug naar facturen
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink-500">
            {invoice.invoice_number}
            <span className="ml-2 text-sm font-normal text-ink-400">{INVOICE_TYPE_LABELS[invoice.type]}</span>
          </h1>
          {invoice.quote_id && (
            <Link href={`/dashboard/offertes/${invoice.quote_id}`} className="text-sm text-blue-600 hover:underline">
              Bekijk bijbehorende offerte
            </Link>
          )}
          {creditedInvoice && (
            <Link href={`/dashboard/facturen/${creditedInvoice.id}`} className="block text-sm text-blue-600 hover:underline">
              Crediteert factuur {creditedInvoice.invoice_number}
            </Link>
          )}
          {creditNote && (
            <Link href={`/dashboard/facturen/${creditNote.id}`} className="block text-sm text-blue-600 hover:underline">
              Gecrediteerd via {creditNote.invoice_number}
            </Link>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Badge tone={INVOICE_STATUS_TONES[invoice.status]}>{INVOICE_STATUS_LABELS[invoice.status]}</Badge>
          <a
            href={`/dashboard/facturen/${invoice.id}/pdf`}
            className="flex items-center gap-1.5 rounded-brand-sm border border-ink-200 bg-white px-3 py-1.5 text-sm font-medium text-ink-500 hover:bg-sand-100"
          >
            <Download className="size-4" />
            Download PDF
          </a>
          {canManageInvoice && (
            <InvoiceActionsBar
              invoiceId={invoice.id}
              status={invoice.status}
              type={invoice.type}
              hasMollieKey={Boolean(organization?.mollie_api_key)}
              hasSlotfactuur={(slotfactuurCount ?? 0) > 0}
              hasCreditNote={Boolean(creditNote)}
            />
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Van</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm text-ink-500">
            <span className="font-medium">{invoice.org_name}</span>
            {orgAddress?.street && <span>{orgAddress.street}</span>}
            {(orgAddress?.postalCode || orgAddress?.city) && (
              <span>
                {orgAddress?.postalCode} {orgAddress?.city}
              </span>
            )}
            {invoice.org_kvk_number && <span>KvK: {invoice.org_kvk_number}</span>}
            {invoice.org_btw_number && <span>Btw: {invoice.org_btw_number}</span>}
            {invoice.org_iban && <span>IBAN: {invoice.org_iban}</span>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aan</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm text-ink-500">
            <span className="font-medium">{invoice.client_name}</span>
            {invoice.client_company && <span>{invoice.client_company}</span>}
            {invoice.client_email && <span>{invoice.client_email}</span>}
            <span className="mt-2 text-ink-400">Factuurdatum: {formatDate(invoice.invoice_date)}</span>
            <span className="text-ink-400">Vervaldatum: {formatDate(invoice.due_date)}</span>
            {invoice.delivery_date && <span className="text-ink-400">Leveringsdatum: {formatDate(invoice.delivery_date)}</span>}
          </CardContent>
        </Card>
      </div>

      {invoice.status === "concept" && canManageInvoice ? (
        <EditInvoiceLinesCard invoiceId={invoice.id} initialLines={editableLines} vatRates={vatRates} catalogItems={catalogItems} />
      ) : (
      <Card>
        <CardHeader>
          <CardTitle>Regels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col divide-y divide-ink-50 text-sm">
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 pb-2 text-xs font-semibold text-ink-400">
              <span>Omschrijving</span>
              <span>Aantal</span>
              <span>Prijs excl.</span>
              <span>Btw</span>
              <span>Totaal incl.</span>
            </div>
            {(lines ?? []).map((line) => (
              <div key={line.id} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 py-2">
                <span className="text-ink-500">{line.description}</span>
                <span className="text-ink-400">{line.quantity}</span>
                <span className="text-ink-400">{formatCurrency(line.unit_price)}</span>
                <span className="text-ink-400">
                  {line.vat_rate}% ({formatCurrency(line.vat_amount)})
                </span>
                <span className="font-medium text-ink-500">{formatCurrency(line.line_total)}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-col items-end gap-1 border-t border-ink-100 pt-4 text-sm">
            <div className="flex w-48 justify-between text-ink-400">
              <span>Subtotaal excl. btw</span>
              <span>{formatCurrency(invoice.subtotal_excl_vat)}</span>
            </div>
            <div className="flex w-48 justify-between text-ink-400">
              <span>Btw</span>
              <span>{formatCurrency(invoice.vat_amount)}</span>
            </div>
            <div className="flex w-48 justify-between text-base font-semibold text-ink-500">
              <span>Totaal incl. btw</span>
              <span>{formatCurrency(invoice.total_incl_vat)}</span>
            </div>
          </div>

          {invoice.paid_at && (
            <p className="mt-3 text-xs text-ink-400">
              Betaald op {formatDate(invoice.paid_at)}
              {invoice.payment_method ? ` (${INVOICE_PAYMENT_METHOD_LABELS[invoice.payment_method]})` : ""}
              {invoice.paid_note ? ` — ${invoice.paid_note}` : ""}
            </p>
          )}
        </CardContent>
      </Card>
      )}
    </div>
  );
}
