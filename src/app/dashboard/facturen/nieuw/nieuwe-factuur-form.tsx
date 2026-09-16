"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClientCombobox, type SelectedClient } from "@/components/builder/client-combobox";
import { LineItemsEditor, newEditableLine, resolveVatRate, type EditableLine, type CatalogItemOption } from "@/components/invoicing/line-items-editor";
import { cn, formatCurrency } from "@/lib/utils";
import { calculateInvoiceLineFromExcl, sumInvoiceLines, roundCents } from "@/lib/invoicing/vat";
import type { InvoiceVatRateType } from "@/lib/types/database";
import type { DepositMode } from "@/lib/invoicing/deposit";
import { createStandaloneInvoice } from "../actions";

const inputClass =
  "h-10 rounded-brand-sm border border-ink-200 bg-white px-3 text-sm text-ink-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20";

export function NieuweFactuurForm({
  vatRates,
  catalogItems,
}: {
  vatRates: { hoog: number; laag: number };
  catalogItems: CatalogItemOption[];
}) {
  const [clientMode, setClientMode] = useState<"bestaand" | "eenmalig">("bestaand");
  const [selectedClient, setSelectedClient] = useState<SelectedClient | null>(null);
  const [freeName, setFreeName] = useState("");
  const [freeCompany, setFreeCompany] = useState("");
  const [freeEmail, setFreeEmail] = useState("");
  const [freeStreet, setFreeStreet] = useState("");
  const [freePostalCode, setFreePostalCode] = useState("");
  const [freeCity, setFreeCity] = useState("");

  const [lines, setLines] = useState<EditableLine[]>([newEditableLine()]);

  const [mode, setMode] = useState<"volledig" | "aanbetaling">("volledig");
  const [depositMode, setDepositMode] = useState<DepositMode>("percentage");
  const [depositValue, setDepositValue] = useState("30");
  const [depositVatType, setDepositVatType] = useState<InvoiceVatRateType>("hoog");
  const [depositVatCustom, setDepositVatCustom] = useState("21");

  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isFixedDeposit = mode === "aanbetaling" && depositMode === "fixed";

  // Live voorbeeld van het daadwerkelijke aanbetalingsbedrag -- anders zie
  // je bij een percentage pas na het aanmaken wat dat in euro's betekent.
  const orderTotalInclVat = sumInvoiceLines(
    lines.map((line) => {
      const vatRate = resolveVatRate(line, vatRates);
      const amounts = calculateInvoiceLineFromExcl({ quantity: line.quantity, unitPriceExclVat: line.unitPrice, vatRate });
      return { unitPriceExclVat: line.unitPrice, quantity: line.quantity, vatAmount: amounts.vatAmount, lineTotalInclVat: amounts.lineTotalInclVat };
    }),
  ).totalInclVat;
  const depositValueNumeric = Number(depositValue.replace(",", "."));
  const depositPreview =
    mode === "aanbetaling" && depositValueNumeric > 0
      ? depositMode === "fixed"
        ? roundCents(depositValueNumeric)
        : roundCents(orderTotalInclVat * (depositValueNumeric / 100))
      : null;

  function submit() {
    setError(null);

    if (clientMode === "bestaand" && !selectedClient) {
      setError("Kies een klant, of schakel over naar 'Eenmalig'.");
      return;
    }
    if (clientMode === "eenmalig" && !freeName.trim()) {
      setError("Vul een klantnaam in.");
      return;
    }
    if (lines.length === 0 && !isFixedDeposit) {
      setError("Voeg minstens één regel toe.");
      return;
    }

    const resolvedLines = isFixedDeposit
      ? []
      : lines.map((line) => ({
          description: line.description,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          vatRate:
            line.vatRateType === "hoog"
              ? vatRates.hoog
              : line.vatRateType === "laag"
                ? vatRates.laag
                : line.vatRateType === "nul"
                  ? 0
                  : line.vatRateCustom,
          catalogItemId: line.catalogItemId,
        }));

    let depositOption: { depositMode: DepositMode; value: number; vatRate: number } | undefined;
    if (mode === "aanbetaling") {
      const numericValue = Number(depositValue.replace(",", "."));
      if (!numericValue || numericValue <= 0) {
        setError("Vul een geldig aanbetalingsbedrag of -percentage in.");
        return;
      }
      if (depositMode === "percentage" && numericValue > 100) {
        setError("Een percentage kan niet hoger dan 100 zijn.");
        return;
      }
      const depositVatRate =
        depositVatType === "hoog"
          ? vatRates.hoog
          : depositVatType === "laag"
            ? vatRates.laag
            : depositVatType === "nul"
              ? 0
              : Number(depositVatCustom) || 0;
      depositOption = { depositMode, value: numericValue, vatRate: depositVatRate };
    }

    startTransition(() =>
      createStandaloneInvoice({
        client:
          clientMode === "bestaand"
            ? { kind: "existing", clientId: selectedClient!.id }
            : {
                kind: "freeform",
                name: freeName,
                company: freeCompany || null,
                email: freeEmail || null,
                address: freeStreet || freePostalCode || freeCity ? { street: freeStreet, postalCode: freePostalCode, city: freeCity } : null,
              },
        lines: resolvedLines,
        mode,
        depositOption,
      }),
    );
  }

  return (
    <div className="flex flex-col gap-6" data-faq-id="new-invoice-form">
      <Link href="/dashboard/facturen" className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-500">
        <ArrowLeft className="size-4" />
        Terug naar facturen
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-ink-500">Nieuwe factuur</h1>
        <p className="text-sm text-ink-400">Zonder offerte — helemaal vanaf 0 samenstellen.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Klant</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setClientMode("bestaand")}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-semibold",
                clientMode === "bestaand" ? "border-teal-500 bg-teal-500 text-white" : "border-ink-200 text-ink-400",
              )}
            >
              Bestaande klant
            </button>
            <button
              type="button"
              onClick={() => setClientMode("eenmalig")}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-semibold",
                clientMode === "eenmalig" ? "border-teal-500 bg-teal-500 text-white" : "border-ink-200 text-ink-400",
              )}
            >
              Eenmalig (geen klantrecord)
            </button>
          </div>

          {clientMode === "bestaand" ? (
            <ClientCombobox value={selectedClient} onChange={setSelectedClient} />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <input value={freeName} onChange={(e) => setFreeName(e.target.value)} placeholder="Naam" className={inputClass} />
              <input value={freeCompany} onChange={(e) => setFreeCompany(e.target.value)} placeholder="Bedrijfsnaam (optioneel)" className={inputClass} />
              <input value={freeEmail} onChange={(e) => setFreeEmail(e.target.value)} placeholder="E-mailadres (optioneel)" className={inputClass} />
              <input value={freeStreet} onChange={(e) => setFreeStreet(e.target.value)} placeholder="Straat + huisnummer" className={inputClass} />
              <input value={freePostalCode} onChange={(e) => setFreePostalCode(e.target.value)} placeholder="Postcode" className={inputClass} />
              <input value={freeCity} onChange={(e) => setFreeCity(e.target.value)} placeholder="Plaats" className={inputClass} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Type factuur</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setMode("volledig")}
              className={cn(
                "flex-1 rounded-brand-sm border px-3 py-2 text-sm font-semibold transition-colors duration-200 ease-brand",
                mode === "volledig" ? "border-teal-500 bg-teal-500 text-white" : "border-ink-200 text-ink-400 hover:border-ink-300",
              )}
            >
              Volledige factuur
            </button>
            <button
              type="button"
              onClick={() => setMode("aanbetaling")}
              className={cn(
                "flex-1 rounded-brand-sm border px-3 py-2 text-sm font-semibold transition-colors duration-200 ease-brand",
                mode === "aanbetaling" ? "border-teal-500 bg-teal-500 text-white" : "border-ink-200 text-ink-400 hover:border-ink-300",
              )}
            >
              Aanbetaling
            </button>
          </div>

          {mode === "aanbetaling" && (
            <div className="flex flex-col gap-3 rounded-brand-sm bg-sand-100 p-3">
              <p className="text-xs text-ink-400">
                {depositMode === "percentage"
                  ? "De regels hieronder bepalen de volledige ordertotaal waar het percentage van berekend wordt. Er komt één aanbetalingsregel op deze factuur; de rest volgt later via een slotfactuur (voorgevuld met deze regels, dan nog aan te passen)."
                  : "Een vast bedrag staat los van een ordertotaal -- er komt één aanbetalingsregel op deze factuur. De definitieve bestelling vul je pas in bij het maken van de slotfactuur."}
              </p>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setDepositMode("percentage")}
                  className={cn(
                    "flex-1 rounded-full border px-3 py-1 text-xs font-semibold",
                    depositMode === "percentage" ? "border-teal-500 bg-teal-500 text-white" : "border-ink-200 text-ink-400",
                  )}
                >
                  Percentage
                </button>
                <button
                  type="button"
                  onClick={() => setDepositMode("fixed")}
                  className={cn(
                    "flex-1 rounded-full border px-3 py-1 text-xs font-semibold",
                    depositMode === "fixed" ? "border-teal-500 bg-teal-500 text-white" : "border-ink-200 text-ink-400",
                  )}
                >
                  Vast bedrag
                </button>
              </div>
              <input
                value={depositValue}
                onChange={(e) => setDepositValue(e.target.value)}
                inputMode="decimal"
                className={inputClass}
                placeholder={depositMode === "percentage" ? "Percentage van het totaal (incl. btw)" : "Bedrag incl. btw"}
              />
              {depositPreview != null && (
                <p className="text-sm text-ink-500">
                  Deze aanbetaling wordt <span className="font-semibold">{formatCurrency(depositPreview)}</span> incl.
                  btw
                  {depositMode === "percentage" && (
                    <>
                      {" "}
                      (van een orderwaarde van {formatCurrency(orderTotalInclVat)})
                    </>
                  )}
                  .
                </p>
              )}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-ink-400">Btw-tarief over de aanbetaling zelf</span>
                <div className="flex gap-1.5">
                  {(["hoog", "laag", "nul", "aangepast"] as InvoiceVatRateType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setDepositVatType(type)}
                      className={cn(
                        "flex-1 rounded-brand-sm border px-2 py-1.5 text-xs font-semibold transition-colors duration-200 ease-brand",
                        depositVatType === type ? "border-teal-500 bg-teal-500 text-white" : "border-ink-200 text-ink-400 hover:border-ink-300",
                      )}
                    >
                      {type === "hoog" ? "Hoog" : type === "laag" ? "Laag" : type === "nul" ? "0%" : "Anders"}
                    </button>
                  ))}
                </div>
                {depositVatType === "aangepast" && (
                  <input
                    type="number"
                    step="0.01"
                    value={depositVatCustom}
                    onChange={(e) => setDepositVatCustom(e.target.value)}
                    className={inputClass}
                  />
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {!isFixedDeposit && (
        <Card>
          <CardHeader>
            <CardTitle>Regels</CardTitle>
          </CardHeader>
          <CardContent>
            <LineItemsEditor lines={lines} onChange={setLines} vatRates={vatRates} catalogItems={catalogItems} />
          </CardContent>
        </Card>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div>
        <Button type="button" variant="primary" onClick={submit} disabled={pending}>
          {pending ? "Bezig…" : "Factuur aanmaken"}
        </Button>
      </div>
    </div>
  );
}
