import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

type Client = SupabaseClient<Database>;

export type Quarter = 1 | 2 | 3 | 4;

export type VatRateBucket = {
  /** Omzet excl. btw voor dit tarief (rubriek 1a/1b/1e-omzet). */
  omzetExclVat: number;
  /** Verschuldigde btw voor dit tarief. */
  vatAmount: number;
};

export type VatReturnInvoiceRow = {
  id: string;
  invoiceNumber: string;
  type: string;
  status: string;
  invoiceDate: string;
  clientName: string;
  omzetExclVat: number;
  vatHigh: number;
  vatLow: number;
  vatOther: number;
  totalInclVat: number;
};

export type VatReturn = {
  year: number;
  quarter: Quarter;
  /** Inclusief (rangeStart) / exclusief (rangeEnd), beide 'YYYY-MM-DD'. */
  rangeStart: string;
  rangeEnd: string;
  vatRateHigh: number;
  vatRateLow: number;
  high: VatRateBucket;
  low: VatRateBucket;
  other: VatRateBucket;
  /** Rubriek 5a: totaal verschuldigde btw (som van high/low/other). */
  totalVat: number;
  totalOmzet: number;
  invoices: VatReturnInvoiceRow[];
};

/**
 * Kwartaalgrenzen als platte 'YYYY-MM-DD'-strings i.p.v. Date-objecten --
 * `invoices.invoice_date` is een kale SQL `date`-kolom zonder tijd/timezone,
 * dus stringvergelijking (`>= start && < end`) is hier correct en voorkomt
 * de bekende `toISOString().slice(0,10)`-tijdzoneval die elders in dit
 * project al twee keer is gefixt (events-calendar.tsx, closed-date-picker).
 */
export function quarterRange(year: number, quarter: Quarter): { start: string; end: string } {
  const startMonth = (quarter - 1) * 3 + 1;
  const endMonthRaw = startMonth + 3;
  const endYear = endMonthRaw > 12 ? year + 1 : year;
  const endMonth = endMonthRaw > 12 ? endMonthRaw - 12 : endMonthRaw;
  return {
    start: `${year}-${String(startMonth).padStart(2, "0")}-01`,
    end: `${endYear}-${String(endMonth).padStart(2, "0")}-01`,
  };
}

export function currentQuarter(): { year: number; quarter: Quarter } {
  const now = new Date();
  return { year: now.getFullYear(), quarter: (Math.floor(now.getMonth() / 3) + 1) as Quarter };
}

/**
 * Btw-aangifte-overzicht voor de "verkoopkant" (rubriek 1a/1b + 5a) van een
 * kwartaal -- op factuurdatum (factuurstelsel, zelfde basis als het
 * bestaande btw-overzicht op de factuur-statistiekenpagina). Concept- en
 * geannuleerde facturen tellen niet mee (nog niet/niet meer een fiscaal
 * relevante prestatie); creditnota's tellen wél mee, met hun al-negatieve
 * bedragen, dus die corrigeren de rubriek vanzelf. Voorbelasting (btw op
 * eigen inkopen, rubriek 5b) zit hier bewust niet in -- Kwotio heeft geen
 * inkopen/uitgaven-registratie, dat vult de gebruiker apart in bij de
 * aangifte zelf.
 */
export async function getVatReturnForQuarter(
  supabase: Client,
  organizationId: string,
  year: number,
  quarter: Quarter,
): Promise<VatReturn> {
  const { start, end } = quarterRange(year, quarter);

  const { data: organization } = await supabase
    .from("organizations")
    .select("invoice_vat_rate_high, invoice_vat_rate_low")
    .eq("id", organizationId)
    .maybeSingle();
  const vatRateHigh = Number(organization?.invoice_vat_rate_high ?? 21);
  const vatRateLow = Number(organization?.invoice_vat_rate_low ?? 9);

  const { data: invoiceRows } = await supabase
    .from("invoices")
    .select("id, invoice_number, type, status, invoice_date, client_name, subtotal_excl_vat, total_incl_vat")
    .eq("organization_id", organizationId)
    .not("status", "in", '("concept","geannuleerd")')
    .gte("invoice_date", start)
    .lt("invoice_date", end)
    .order("invoice_date", { ascending: true });
  const invoices = invoiceRows ?? [];

  const invoiceIds = invoices.map((i) => i.id);
  const { data: lineRows } =
    invoiceIds.length > 0
      ? await supabase.from("invoice_lines").select("invoice_id, vat_rate, vat_amount, line_total").in("invoice_id", invoiceIds)
      : { data: [] };
  const lines = lineRows ?? [];

  const high: VatRateBucket = { omzetExclVat: 0, vatAmount: 0 };
  const low: VatRateBucket = { omzetExclVat: 0, vatAmount: 0 };
  const other: VatRateBucket = { omzetExclVat: 0, vatAmount: 0 };
  const perInvoiceVat = new Map<string, { high: number; low: number; other: number }>();

  for (const line of lines) {
    const rate = Number(line.vat_rate);
    const vatAmount = Number(line.vat_amount);
    const omzet = Number(line.line_total) - vatAmount;
    const bucket = rate === vatRateHigh ? high : rate === vatRateLow ? low : other;
    bucket.omzetExclVat += omzet;
    bucket.vatAmount += vatAmount;

    const perInv = perInvoiceVat.get(line.invoice_id) ?? { high: 0, low: 0, other: 0 };
    if (rate === vatRateHigh) perInv.high += vatAmount;
    else if (rate === vatRateLow) perInv.low += vatAmount;
    else perInv.other += vatAmount;
    perInvoiceVat.set(line.invoice_id, perInv);
  }

  const invoiceDetails: VatReturnInvoiceRow[] = invoices.map((inv) => {
    const perInv = perInvoiceVat.get(inv.id) ?? { high: 0, low: 0, other: 0 };
    return {
      id: inv.id,
      invoiceNumber: inv.invoice_number,
      type: inv.type,
      status: inv.status,
      invoiceDate: inv.invoice_date,
      clientName: inv.client_name,
      omzetExclVat: Number(inv.subtotal_excl_vat),
      vatHigh: perInv.high,
      vatLow: perInv.low,
      vatOther: perInv.other,
      totalInclVat: Number(inv.total_incl_vat),
    };
  });

  return {
    year,
    quarter,
    rangeStart: start,
    rangeEnd: end,
    vatRateHigh,
    vatRateLow,
    high,
    low,
    other,
    totalVat: high.vatAmount + low.vatAmount + other.vatAmount,
    totalOmzet: high.omzetExclVat + low.omzetExclVat + other.omzetExclVat,
    invoices: invoiceDetails,
  };
}
