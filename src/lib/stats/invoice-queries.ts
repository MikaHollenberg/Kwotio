import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, InvoiceStatus, InvoicePaymentMethod } from "@/lib/types/database";

type Client = SupabaseClient<Database>;

const MONTHLY_REVENUE_MONTHS = 6;

export type InvoiceStats = {
  kpi: {
    receivedThisMonth: number;
    outstandingAmount: number;
    outstandingCount: number;
    overdueAmount: number;
    overdueCount: number;
    avgPaymentDays: number | null;
  };
  statusCounts: Record<InvoiceStatus, number>;
  monthlyRevenue: { monthKey: string; label: string; total: number }[];
  vat: {
    month: { high: number; low: number; other: number; total: number };
    quarter: { high: number; low: number; other: number; total: number };
  };
  funStats: {
    avgInvoiceValue: number;
    largestInvoiceThisMonth: { amount: number; clientName: string } | null;
    fastestPaymentDays: number | null;
    awaitingSlotfactuurCount: number;
  };
  paymentMethods: { method: InvoicePaymentMethod; count: number; percent: number }[];
  topClients: { name: string; total: number }[];
};

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

/**
 * Alle factuurstatistieken in één keer -- zelfde aanpak als `getPipeline`/
 * `getMonthlySeries` (alles ophalen, in JS berekenen i.p.v. losse
 * aggregatiequeries per kaart) omdat het aantal facturen voor een bedrijf
 * als dit klein genoeg is om dat probleemloos te doen.
 *
 * Creditnota's tellen NIET mee in de omzet-achtige cijfers (ontvangen/
 * openstaand/gem. factuurwaarde/grootste factuur/top klanten) -- een
 * creditnota is geen omzet, maar corrigeert 'm juist. Ze tellen wél mee in
 * "Facturen per status" en het btw-overzicht (die negatieve btw hoort
 * correct verrekend te worden).
 */
export async function getInvoiceStats(supabase: Client, organizationId: string): Promise<InvoiceStats> {
  const { data: invoiceRows } = await supabase
    .from("invoices")
    .select(
      "id, type, status, client_id, client_name, invoice_date, due_date, paid_at, sent_at, subtotal_excl_vat, vat_amount, total_incl_vat, payment_method",
    )
    .eq("organization_id", organizationId);
  const invoices = invoiceRows ?? [];

  const { data: organization } = await supabase
    .from("organizations")
    .select("invoice_vat_rate_high, invoice_vat_rate_low")
    .eq("id", organizationId)
    .maybeSingle();
  const vatRateHigh = Number(organization?.invoice_vat_rate_high ?? 21);
  const vatRateLow = Number(organization?.invoice_vat_rate_low ?? 9);

  const validInvoiceIds = invoices.filter((i) => i.status !== "concept" && i.status !== "geannuleerd").map((i) => i.id);
  const { data: lineRows } =
    validInvoiceIds.length > 0
      ? await supabase.from("invoice_lines").select("invoice_id, vat_rate, vat_amount").in("invoice_id", validInvoiceIds)
      : { data: [] };
  const lines = lineRows ?? [];
  const invoiceById = new Map(invoices.map((i) => [i.id, i]));

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
  const quarterStart = new Date(now.getFullYear(), quarterStartMonth, 1);

  // -- Statuscounts (alle types) -------------------------------------------
  const statusCounts: Record<InvoiceStatus, number> = {
    concept: 0,
    open: 0,
    deels_betaald: 0,
    betaald: 0,
    vervallen: 0,
    geannuleerd: 0,
  };
  for (const inv of invoices) statusCounts[inv.status]++;

  // -- Revenue-achtige cijfers (geen creditnota's) -------------------------
  const revenueInvoices = invoices.filter((i) => i.type !== "creditnota");
  const paidInvoices = revenueInvoices.filter((i) => i.status === "betaald" && i.paid_at);

  const receivedThisMonth = paidInvoices
    .filter((i) => new Date(i.paid_at!) >= monthStart)
    .reduce((sum, i) => sum + Number(i.total_incl_vat), 0);

  const outstandingInvoices = revenueInvoices.filter((i) => i.status === "open" || i.status === "deels_betaald");
  const outstandingAmount = outstandingInvoices.reduce((sum, i) => sum + Number(i.total_incl_vat), 0);

  const overdueInvoices = revenueInvoices.filter((i) => i.status === "vervallen");
  const overdueAmount = overdueInvoices.reduce((sum, i) => sum + Number(i.total_incl_vat), 0);

  const paymentDurations = paidInvoices.filter((i) => i.sent_at).map((i) => daysBetween(i.sent_at!, i.paid_at!));
  const avgPaymentDays =
    paymentDurations.length > 0 ? Math.round(paymentDurations.reduce((s, d) => s + d, 0) / paymentDurations.length) : null;
  const fastestPaymentDays = paymentDurations.length > 0 ? Math.min(...paymentDurations) : null;

  // -- Omzet per maand (laatste 6 maanden, betaald) ------------------------
  const monthlyRevenue: InvoiceStats["monthlyRevenue"] = [];
  for (let i = MONTHLY_REVENUE_MONTHS - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const total = paidInvoices
      .filter((inv) => {
        const paidAt = new Date(inv.paid_at!);
        return paidAt >= start && paidAt < end;
      })
      .reduce((sum, inv) => sum + Number(inv.total_incl_vat), 0);
    monthlyRevenue.push({
      monthKey: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`,
      label: start.toLocaleDateString("nl-NL", { month: "short" }),
      total,
    });
  }

  // -- Btw-overzicht (op factuurdatum, alle niet-concept/geannuleerd) ------
  function vatBucketsFor(fromDate: Date) {
    const buckets = { high: 0, low: 0, other: 0, total: 0 };
    for (const line of lines) {
      const inv = invoiceById.get(line.invoice_id);
      if (!inv || new Date(inv.invoice_date) < fromDate) continue;
      const amount = Number(line.vat_amount);
      const rate = Number(line.vat_rate);
      if (rate === vatRateHigh) buckets.high += amount;
      else if (rate === vatRateLow) buckets.low += amount;
      else buckets.other += amount;
      buckets.total += amount;
    }
    return buckets;
  }
  const vat = { month: vatBucketsFor(monthStart), quarter: vatBucketsFor(quarterStart) };

  // -- Leuke weetjes ---------------------------------------------------------
  const avgInvoiceValue =
    paidInvoices.length > 0 ? paidInvoices.reduce((sum, i) => sum + Number(i.total_incl_vat), 0) / paidInvoices.length : 0;

  const invoicesThisMonth = revenueInvoices.filter((i) => new Date(i.invoice_date) >= monthStart);
  const largest = invoicesThisMonth.reduce<{ amount: number; clientName: string } | null>((best, inv) => {
    const amount = Number(inv.total_incl_vat);
    if (!best || amount > best.amount) return { amount, clientName: inv.client_name || "—" };
    return best;
  }, null);

  const depositIds = new Set(invoices.filter((i) => i.type === "aanbetaling" && i.status === "betaald").map((i) => i.id));
  const { data: slotfactuurLinks } = await supabase
    .from("invoices")
    .select("deposit_invoice_id")
    .eq("organization_id", organizationId)
    .eq("type", "slotfactuur")
    .not("deposit_invoice_id", "is", null);
  const invoicesWithSlotfactuur = new Set((slotfactuurLinks ?? []).map((l) => l.deposit_invoice_id));
  const awaitingSlotfactuurCount = [...depositIds].filter((id) => !invoicesWithSlotfactuur.has(id)).length;

  // -- Betaalmethodes --------------------------------------------------------
  const methodCounts = new Map<InvoicePaymentMethod, number>();
  for (const inv of paidInvoices) {
    if (!inv.payment_method) continue;
    methodCounts.set(inv.payment_method, (methodCounts.get(inv.payment_method) ?? 0) + 1);
  }
  const totalWithMethod = [...methodCounts.values()].reduce((s, c) => s + c, 0);
  const paymentMethods = [...methodCounts.entries()]
    .map(([method, count]) => ({ method, count, percent: totalWithMethod > 0 ? Math.round((count / totalWithMethod) * 100) : 0 }))
    .sort((a, b) => b.count - a.count);

  // -- Top klanten (dit jaar, betaald) ----------------------------------------
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const clientTotals = new Map<string, { name: string; total: number }>();
  for (const inv of paidInvoices) {
    if (new Date(inv.paid_at!) < yearStart) continue;
    const key = inv.client_id ?? inv.client_name;
    const existing = clientTotals.get(key);
    if (existing) existing.total += Number(inv.total_incl_vat);
    else clientTotals.set(key, { name: inv.client_name || "—", total: Number(inv.total_incl_vat) });
  }
  const topClients = [...clientTotals.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return {
    kpi: {
      receivedThisMonth,
      outstandingAmount,
      outstandingCount: outstandingInvoices.length,
      overdueAmount,
      overdueCount: overdueInvoices.length,
      avgPaymentDays,
    },
    statusCounts,
    monthlyRevenue,
    vat,
    funStats: {
      avgInvoiceValue,
      largestInvoiceThisMonth: largest,
      fastestPaymentDays,
      awaitingSlotfactuurCount,
    },
    paymentMethods,
    topClients,
  };
}
