import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { CatalogItemOption, EditableLine } from "@/components/invoicing/line-items-editor";
import type { InvoiceVatRateType, DepositBasisLine } from "@/lib/types/database";
import { SlotfactuurForm } from "./slotfactuur-form";

function vatRateToType(rate: number, vatRates: { hoog: number; laag: number }): InvoiceVatRateType {
  if (rate === vatRates.hoog) return "hoog";
  if (rate === vatRates.laag) return "laag";
  if (rate === 0) return "nul";
  return "aangepast";
}

/**
 * Bouwt de slotfactuur op met de definitieve bestelling -- geen
 * automatische "restbedrag = geschatte orderwaarde min aanbetaling"-
 * berekening meer (zie `createSlotfactuurFromLines`). Bij een PERCENTAGE-
 * aanbetaling wordt de regel-editor voorgevuld met de basisregels van
 * destijds (`deposit_basis_lines`) -- gewoon aanpasbaar als er iets
 * gewijzigd/toegevoegd/afgevallen is. Bij een VAST bedrag zijn er geen
 * basisregels (staat bewust los van elk aantal) en begint de editor leeg.
 * De aanbetaling zelf komt in beide gevallen als kant-en-klare, aanpasbare
 * negatieve regel erbij.
 */
export default async function SlotfactuurNieuwPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: depositInvoiceId } = await params;
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
  if (profile.role !== "owner" && profile.role !== "admin") redirect(`/dashboard/facturen/${depositInvoiceId}`);

  const { data: depositInvoice } = await supabase
    .from("invoices")
    .select("id, type, invoice_number, paid_at, deposit_invoice_id, deposit_basis_lines")
    .eq("id", depositInvoiceId)
    .maybeSingle();
  if (!depositInvoice) notFound();
  if (depositInvoice.type !== "aanbetaling" || !depositInvoice.paid_at) {
    redirect(`/dashboard/facturen/${depositInvoiceId}`);
  }

  const [{ data: depositLine }, { data: organization }, { data: catalogItemRows }, { count: existingSlotfactuurCount }] = await Promise.all([
    supabase
      .from("invoice_lines")
      .select("description, unit_price, vat_rate")
      .eq("invoice_id", depositInvoiceId)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("organizations")
      .select("invoice_vat_rate_high, invoice_vat_rate_low")
      .eq("id", profile.organization_id)
      .maybeSingle(),
    supabase
      .from("invoice_catalog_items")
      .select("id, name, description, unit_price, vat_rate_type, vat_rate_custom")
      .is("archived_at", null)
      .order("name", { ascending: true }),
    supabase.from("invoices").select("id", { count: "exact", head: true }).eq("deposit_invoice_id", depositInvoiceId).eq("type", "slotfactuur"),
  ]);

  if ((existingSlotfactuurCount ?? 0) > 0) redirect(`/dashboard/facturen/${depositInvoiceId}`);

  const vatRates = { hoog: organization?.invoice_vat_rate_high ?? 21, laag: organization?.invoice_vat_rate_low ?? 9 };
  const catalogItems: CatalogItemOption[] = (catalogItemRows ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    unitPrice: Number(c.unit_price),
    vatRateType: c.vat_rate_type,
    vatRateCustom: c.vat_rate_custom != null ? Number(c.vat_rate_custom) : null,
  }));

  // Bij een percentage-aanbetaling: de basisregels van destijds (offerte-
  // pakketten, of zelf ingevulde regels) alvast invullen -- gewoon
  // aanpasbaar hieronder. Bij een vast bedrag zijn die er niet.
  const basisLines: DepositBasisLine[] = depositInvoice.deposit_basis_lines ?? [];
  const basisSeedLines: EditableLine[] = basisLines.map((line) => ({
    key: crypto.randomUUID(),
    description: line.description,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
    vatRateType: vatRateToType(line.vatRate, vatRates),
    vatRateCustom: line.vatRate,
    catalogItemId: null,
  }));

  // De aanbetaling als kant-en-klare, aanpasbare negatieve regel -- staat
  // los van welke regels je hieronder verder invult.
  const depositSeedLine: EditableLine | null = depositLine
    ? {
        key: crypto.randomUUID(),
        description: `Aanbetaling reeds voldaan (factuur ${depositInvoice.invoice_number})`,
        quantity: 1,
        unitPrice: -Number(depositLine.unit_price),
        vatRateType: vatRateToType(Number(depositLine.vat_rate), vatRates),
        vatRateCustom: Number(depositLine.vat_rate),
        catalogItemId: null,
      }
    : null;

  const seedLines: EditableLine[] = [...basisSeedLines, ...(depositSeedLine ? [depositSeedLine] : [])];

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/dashboard/facturen/${depositInvoiceId}`}
        className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-500"
      >
        <ArrowLeft className="size-4" />
        Terug naar factuur {depositInvoice.invoice_number}
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-ink-500">Slotfactuur maken</h1>
        <p className="text-sm text-ink-400">
          {basisSeedLines.length > 0
            ? `De regels zijn voorgevuld op basis van de oorspronkelijke bestelling -- pas aan wat gewijzigd, toegevoegd of afgevallen is. De aanbetaling (factuur ${depositInvoice.invoice_number}) staat hieronder al als regel verrekend.`
            : `Vul de definitieve bestelling in -- de aanbetaling (factuur ${depositInvoice.invoice_number}) staat hieronder al als regel verrekend.`}
        </p>
      </div>

      <SlotfactuurForm depositInvoiceId={depositInvoiceId} seedLines={seedLines} vatRates={vatRates} catalogItems={catalogItems} />
    </div>
  );
}
