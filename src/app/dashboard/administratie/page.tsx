import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Landmark } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExportCsvButton } from "@/components/dashboard/export-csv-button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { INVOICE_TYPE_LABELS } from "@/lib/invoicing/status";
import { getVatReturnForQuarter, quarterRange, currentQuarter, type Quarter } from "@/lib/invoicing/vat-return";
import { isInvoicingEnabled } from "@/lib/invoicing/feature-flag";
import { QuarterPicker } from "./quarter-picker";

function parseQuarter(value: string | undefined): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 4 ? n : null;
}

function prevQuarter(year: number, quarter: Quarter): { year: number; quarter: Quarter } {
  return quarter === 1 ? { year: year - 1, quarter: 4 } : { year, quarter: (quarter - 1) as Quarter };
}

function nextQuarter(year: number, quarter: Quarter): { year: number; quarter: Quarter } {
  return quarter === 4 ? { year: year + 1, quarter: 1 } : { year, quarter: (quarter + 1) as Quarter };
}

export default async function AdministratiePage({
  searchParams,
}: {
  searchParams: Promise<{ jaar?: string; kwartaal?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id, role").eq("id", user!.id).single();
  if (profile?.role !== "owner" && profile?.role !== "admin") redirect("/dashboard");
  if (!isInvoicingEnabled(profile?.organization_id)) redirect("/dashboard");
  const organizationId = profile!.organization_id;

  const params = await searchParams;
  const fallback = currentQuarter();
  const year = Number.isInteger(Number(params.jaar)) ? Number(params.jaar) : fallback.year;
  const quarter = (parseQuarter(params.kwartaal) ?? fallback.quarter) as Quarter;

  const vatReturn = await getVatReturnForQuarter(supabase, organizationId, year, quarter);
  const prev = prevQuarter(year, quarter);
  const next = nextQuarter(year, quarter);
  const { start: rangeStartLabel, end: rangeEndExclusive } = quarterRange(year, quarter);
  const rangeEndLabel = formatDate(new Date(new Date(rangeEndExclusive).getTime() - 86_400_000));

  const yearsInRange = new Set([year, fallback.year]);
  for (let y = fallback.year - 4; y <= fallback.year; y++) yearsInRange.add(y);
  const years = [...yearsInRange].sort((a, b) => b - a);

  const summaryRows = [
    {
      Rubriek: "1a",
      Omschrijving: `Hoog tarief (${vatReturn.vatRateHigh}%)`,
      "Omzet (excl. btw)": vatReturn.high.omzetExclVat.toFixed(2),
      "Btw-bedrag": vatReturn.high.vatAmount.toFixed(2),
    },
    {
      Rubriek: "1b",
      Omschrijving: `Laag tarief (${vatReturn.vatRateLow}%)`,
      "Omzet (excl. btw)": vatReturn.low.omzetExclVat.toFixed(2),
      "Btw-bedrag": vatReturn.low.vatAmount.toFixed(2),
    },
    {
      Rubriek: "1e/overig",
      Omschrijving: "0% of afwijkend tarief",
      "Omzet (excl. btw)": vatReturn.other.omzetExclVat.toFixed(2),
      "Btw-bedrag": vatReturn.other.vatAmount.toFixed(2),
    },
    {
      Rubriek: "5a",
      Omschrijving: "Totaal verschuldigde btw",
      "Omzet (excl. btw)": vatReturn.totalOmzet.toFixed(2),
      "Btw-bedrag": vatReturn.totalVat.toFixed(2),
    },
  ];

  const invoiceRows = vatReturn.invoices.map((inv) => ({
    Factuurnummer: inv.invoiceNumber,
    Type: INVOICE_TYPE_LABELS[inv.type as keyof typeof INVOICE_TYPE_LABELS] ?? inv.type,
    Factuurdatum: formatDate(inv.invoiceDate),
    Klant: inv.clientName,
    "Omzet (excl. btw)": inv.omzetExclVat.toFixed(2),
    "Btw hoog": inv.vatHigh.toFixed(2),
    "Btw laag": inv.vatLow.toFixed(2),
    "Btw overig": inv.vatOther.toFixed(2),
    "Totaal (incl. btw)": inv.totalInclVat.toFixed(2),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-sm text-ink-400">
            <Landmark className="size-4" /> Btw-aangifte per kwartaal
          </p>
          <h1 className="font-display text-2xl font-semibold text-ink-500">Administratie</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/administratie?jaar=${prev.year}&kwartaal=${prev.quarter}`}
            className="flex size-9 items-center justify-center rounded-brand-sm border border-ink-200 text-ink-400 hover:bg-sand-200 hover:text-ink-500"
            title="Vorig kwartaal"
          >
            <ChevronLeft className="size-4" />
          </Link>
          <QuarterPicker year={year} quarter={quarter} years={years} />
          <Link
            href={`/dashboard/administratie?jaar=${next.year}&kwartaal=${next.quarter}`}
            className="flex size-9 items-center justify-center rounded-brand-sm border border-ink-200 text-ink-400 hover:bg-sand-200 hover:text-ink-500"
            title="Volgend kwartaal"
          >
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>
                Q{quarter} {year}
              </CardTitle>
              <CardDescription>
                {formatDate(rangeStartLabel)} t/m {rangeEndLabel} · op factuurdatum · {vatReturn.invoices.length}{" "}
                {vatReturn.invoices.length === 1 ? "factuur" : "facturen"}
              </CardDescription>
            </div>
            <ExportCsvButton rows={summaryRows} filename={`btw-overzicht-${year}-Q${quarter}.csv`} label="Exporteer overzicht" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs font-semibold uppercase tracking-wide text-ink-400">
                  <th className="py-2 pr-4">Rubriek</th>
                  <th className="py-2 pr-4">Omzet (excl. btw)</th>
                  <th className="py-2 pr-4">Btw-bedrag</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-sand-200">
                  <td className="py-2.5 pr-4">
                    <span className="font-semibold text-ink-500">1a</span>{" "}
                    <span className="text-ink-400">Hoog tarief ({vatReturn.vatRateHigh}%)</span>
                  </td>
                  <td className="py-2.5 pr-4 text-ink-500">{formatCurrency(vatReturn.high.omzetExclVat)}</td>
                  <td className="py-2.5 pr-4 font-medium text-ink-500">{formatCurrency(vatReturn.high.vatAmount)}</td>
                </tr>
                <tr className="border-b border-sand-200">
                  <td className="py-2.5 pr-4">
                    <span className="font-semibold text-ink-500">1b</span>{" "}
                    <span className="text-ink-400">Laag tarief ({vatReturn.vatRateLow}%)</span>
                  </td>
                  <td className="py-2.5 pr-4 text-ink-500">{formatCurrency(vatReturn.low.omzetExclVat)}</td>
                  <td className="py-2.5 pr-4 font-medium text-ink-500">{formatCurrency(vatReturn.low.vatAmount)}</td>
                </tr>
                {(vatReturn.other.omzetExclVat !== 0 || vatReturn.other.vatAmount !== 0) && (
                  <tr className="border-b border-sand-200">
                    <td className="py-2.5 pr-4">
                      <span className="font-semibold text-ink-500">1e</span>{" "}
                      <span className="text-ink-400">0% of afwijkend tarief</span>
                    </td>
                    <td className="py-2.5 pr-4 text-ink-500">{formatCurrency(vatReturn.other.omzetExclVat)}</td>
                    <td className="py-2.5 pr-4 font-medium text-ink-500">{formatCurrency(vatReturn.other.vatAmount)}</td>
                  </tr>
                )}
                <tr>
                  <td className="py-2.5 pr-4">
                    <span className="font-semibold text-ink-500">5a</span>{" "}
                    <span className="text-ink-400">Totaal verschuldigde btw</span>
                  </td>
                  <td className="py-2.5 pr-4 font-semibold text-ink-500">{formatCurrency(vatReturn.totalOmzet)}</td>
                  <td className="py-2.5 pr-4 font-semibold text-teal-700">{formatCurrency(vatReturn.totalVat)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 rounded-brand-sm bg-sand-100 px-3 py-2.5 text-xs text-ink-400">
            Gebaseerd op de factuurdatum van verstuurde, betaalde en vervallen facturen én creditnota&apos;s (concept- en
            geannuleerde facturen tellen niet mee). Dit is rubriek 1a/1b/5a — de <strong>voorbelasting</strong> (btw op je
            eigen inkopen en kosten, rubriek 5b) staat hier niet in en vul je apart in bij je aangifte.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Facturen dit kwartaal</CardTitle>
              <CardDescription>Onderliggende facturen/creditnota&apos;s achter het overzicht hierboven</CardDescription>
            </div>
            <ExportCsvButton rows={invoiceRows} filename={`btw-facturen-${year}-Q${quarter}.csv`} label="Exporteer facturen" />
          </div>
        </CardHeader>
        <CardContent>
          {vatReturn.invoices.length === 0 ? (
            <p className="text-sm text-ink-400">Geen facturen in dit kwartaal.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-ink-100 text-left text-xs font-semibold uppercase tracking-wide text-ink-400">
                    <th className="py-2 pr-4">Nummer</th>
                    <th className="py-2 pr-4">Datum</th>
                    <th className="py-2 pr-4">Klant</th>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4 text-right">Omzet excl. btw</th>
                    <th className="py-2 pr-4 text-right">Btw</th>
                    <th className="py-2 pr-4 text-right">Totaal</th>
                  </tr>
                </thead>
                <tbody>
                  {vatReturn.invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-sand-200 last:border-b-0">
                      <td className="py-2.5 pr-4">
                        <Link href={`/dashboard/facturen/${inv.id}`} className="text-teal-700 hover:underline">
                          {inv.invoiceNumber}
                        </Link>
                      </td>
                      <td className="py-2.5 pr-4 text-ink-400">{formatDate(inv.invoiceDate)}</td>
                      <td className="py-2.5 pr-4 text-ink-500">{inv.clientName}</td>
                      <td className="py-2.5 pr-4 text-ink-400">
                        {INVOICE_TYPE_LABELS[inv.type as keyof typeof INVOICE_TYPE_LABELS] ?? inv.type}
                      </td>
                      <td className="py-2.5 pr-4 text-right text-ink-500">{formatCurrency(inv.omzetExclVat)}</td>
                      <td className="py-2.5 pr-4 text-right text-ink-500">
                        {formatCurrency(inv.vatHigh + inv.vatLow + inv.vatOther)}
                      </td>
                      <td className="py-2.5 pr-4 text-right font-medium text-ink-500">{formatCurrency(inv.totalInclVat)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
