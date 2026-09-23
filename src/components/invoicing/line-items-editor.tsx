"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DecimalField } from "@/components/ui/decimal-field";
import { calculateInvoiceLineFromExcl, sumInvoiceLines, vatFromInclAmount } from "@/lib/invoicing/vat";
import { groupLinesByVat } from "@/lib/invoice-pdf/group-lines-by-vat";
import { cn, formatCurrency } from "@/lib/utils";
import type { InvoiceVatRateType } from "@/lib/types/database";

export type CatalogItemOption = {
  id: string;
  name: string;
  description: string | null;
  unitPrice: number;
  vatRateType: InvoiceVatRateType;
  vatRateCustom: number | null;
};

export type EditableLine = {
  key: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRateType: InvoiceVatRateType;
  vatRateCustom: number;
  catalogItemId: string | null;
};

export function newEditableLine(fromCatalog?: CatalogItemOption): EditableLine {
  return fromCatalog
    ? {
        key: crypto.randomUUID(),
        description: fromCatalog.name,
        quantity: 1,
        unitPrice: fromCatalog.unitPrice,
        vatRateType: fromCatalog.vatRateType,
        vatRateCustom: fromCatalog.vatRateCustom ?? 0,
        catalogItemId: fromCatalog.id,
      }
    : {
        key: crypto.randomUUID(),
        description: "",
        quantity: 1,
        unitPrice: 0,
        vatRateType: "hoog",
        vatRateCustom: 0,
        catalogItemId: null,
      };
}

export function resolveVatRate(line: EditableLine, rates: { hoog: number; laag: number }): number {
  switch (line.vatRateType) {
    case "hoog":
      return rates.hoog;
    case "laag":
      return rates.laag;
    case "nul":
      return 0;
    case "aangepast":
      return line.vatRateCustom;
  }
}

const inputClass =
  "h-9 w-full rounded-brand-sm border border-ink-200 bg-white px-2.5 text-sm text-ink-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 disabled:opacity-60";

const VAT_TYPE_LABELS: Record<InvoiceVatRateType, string> = {
  hoog: "Hoog",
  laag: "Laag",
  nul: "0%",
  aangepast: "Aangepast",
};

/** Ontkoppelt de weergegeven tekst van de numerieke waarde zodra de
 * gebruiker aan het typen is -- een gewoon controlled `type="number"`-veld
 * herschrijft `value` bij elke toetsaanslag naar de geparste/afgeronde
 * waarde, waardoor de cursor steeds naar het einde springt (en decimalen
 * met een komma niet eens getypt kunnen worden). Dit veld synct de tekst
 * dus NOOIT terug vanuit `value` -- alleen de ouder-state (voor
 * berekeningen) volgt wat je typt. Geef een andere `resetKey` mee om 'm
 * bewust wel opnieuw te laten initialiseren (bv. bij het wisselen tussen
 * incl./excl.-weergave). */
/**
 * Gedeelde regel-editor: gebruikt zowel bij "nieuwe losse factuur" als bij
 * het bewerken van een bestaande conceptfactuur. Vrije regels, incl. een
 * negatief bedrag (bv. een aanbetaling-aftrek op dezelfde factuur) -- geen
 * restrictie op het teken van `unitPrice`. `vatRates` zijn de Hoog/Laag-
 * percentages van de organisatie (Instellingen → Facturatie); een regel kan
 * die twee kiezen, of 0%/een eigen percentage via het btw-menuutje.
 *
 * `unitPrice` wordt intern altijd excl. btw bewaard (zelfde contract als
 * `updateInvoiceLines`/`createStandaloneInvoice`) -- de incl./excl.-keuze
 * hieronder is puur een invoervoorkeur voor tijdens het intypen, geen
 * los opgeslagen veld.
 */
export function LineItemsEditor({
  lines,
  onChange,
  vatRates,
  catalogItems,
}: {
  lines: EditableLine[];
  onChange: (lines: EditableLine[]) => void;
  vatRates: { hoog: number; laag: number };
  catalogItems: CatalogItemOption[];
}) {
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [openVatMenuFor, setOpenVatMenuFor] = useState<string | null>(null);
  const [priceMode, setPriceMode] = useState<"incl" | "excl">("incl");

  function updateLine(key: string, patch: Partial<EditableLine>) {
    onChange(lines.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function removeLine(key: string) {
    onChange(lines.filter((l) => l.key !== key));
  }

  /** Prijs intypen als incl. btw rekent terug naar de excl.-prijs die
   * daadwerkelijk wordt opgeslagen. */
  function updatePriceIncl(key: string, newUnitPriceInclVat: number, vatRate: number) {
    const { exclVat } = vatFromInclAmount(newUnitPriceInclVat, vatRate);
    updateLine(key, { unitPrice: exclVat });
  }

  const computed = lines.map((line) => {
    const vatRate = resolveVatRate(line, vatRates);
    const amounts = calculateInvoiceLineFromExcl({
      quantity: line.quantity,
      unitPriceExclVat: line.unitPrice,
      vatRate,
    });
    return { line, vatRate, amounts };
  });
  const totals = sumInvoiceLines(
    computed.map((c) => ({
      unitPriceExclVat: c.line.unitPrice,
      quantity: c.line.quantity,
      vatAmount: c.amounts.vatAmount,
      lineTotalInclVat: c.amounts.lineTotalInclVat,
    })),
  );
  const vatSummary = groupLinesByVat(
    computed.map((c) => ({ unitPrice: c.line.unitPrice, quantity: c.line.quantity, vatRate: c.vatRate, vatAmount: c.amounts.vatAmount })),
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-ink-400">Prijzen invullen als</span>
        <div className="flex rounded-brand-sm border border-ink-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setPriceMode("incl")}
            className={cn(
              "px-3 py-1.5 text-sm font-medium transition-colors duration-200 ease-brand",
              priceMode === "incl" ? "bg-teal-500 text-white" : "bg-white text-ink-400 hover:bg-sand-100",
            )}
          >
            Incl. btw
          </button>
          <button
            type="button"
            onClick={() => setPriceMode("excl")}
            className={cn(
              "px-3 py-1.5 text-sm font-medium transition-colors duration-200 ease-brand",
              priceMode === "excl" ? "bg-teal-500 text-white" : "bg-white text-ink-400 hover:bg-sand-100",
            )}
          >
            Excl. btw
          </button>
        </div>
      </div>

      {computed.length === 0 ? (
        <p className="text-sm text-ink-400">Nog geen regels. Voeg er een toe vanuit de catalogus of vrij.</p>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="hidden grid-cols-[56px_1fr_120px_120px_36px] gap-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-ink-300 sm:grid">
            <span>Aantal</span>
            <span>Omschrijving</span>
            <span>Btw</span>
            <span className="text-right">{priceMode === "incl" ? "Prijs incl." : "Prijs excl."}</span>
            <span />
          </div>
          {computed.map(({ line, vatRate }) => (
            <div
              key={line.key}
              className="grid grid-cols-1 items-start gap-2 rounded-brand-sm border border-ink-100 p-2 sm:grid-cols-[56px_1fr_120px_120px_36px]"
            >
              <DecimalField
                value={line.quantity}
                onCommit={(n) => updateLine(line.key, { quantity: n })}
                className={cn(inputClass, "text-right")}
                title="Aantal"
              />
              <input
                value={line.description}
                onChange={(e) => updateLine(line.key, { description: e.target.value })}
                placeholder="Omschrijving"
                className={inputClass}
              />
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenVatMenuFor(openVatMenuFor === line.key ? null : line.key)}
                  className="flex h-9 w-full items-center justify-between rounded-brand-sm border border-ink-200 bg-white px-2.5 text-sm text-ink-500 hover:border-ink-300"
                >
                  {line.vatRateType === "aangepast" ? `${line.vatRateCustom}%` : `${vatRate}%`}
                  <ChevronDown className="size-3.5 text-ink-400" />
                </button>
                {openVatMenuFor === line.key && (
                  <div className="absolute left-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-brand-sm border border-ink-200 bg-white p-1 shadow-lg">
                    {(Object.keys(VAT_TYPE_LABELS) as InvoiceVatRateType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          updateLine(line.key, { vatRateType: type });
                          setOpenVatMenuFor(null);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between rounded-brand-sm px-2.5 py-1.5 text-left text-sm",
                          line.vatRateType === type ? "bg-teal-500 text-white" : "text-ink-500 hover:bg-sand-100",
                        )}
                      >
                        {VAT_TYPE_LABELS[type]}
                        {type === "hoog" && <span className="text-xs opacity-80">{vatRates.hoog}%</span>}
                        {type === "laag" && <span className="text-xs opacity-80">{vatRates.laag}%</span>}
                      </button>
                    ))}
                  </div>
                )}
                {line.vatRateType === "aangepast" && (
                  <DecimalField
                    value={line.vatRateCustom}
                    onCommit={(n) => updateLine(line.key, { vatRateCustom: n })}
                    className={cn(inputClass, "mt-1 h-8 text-right text-xs")}
                    title="Eigen btw-percentage"
                    placeholder="Eigen % btw"
                  />
                )}
              </div>
              {priceMode === "incl" ? (
                <DecimalField
                  key={`${line.key}-incl`}
                  value={calculateInvoiceLineFromExcl({ quantity: 1, unitPriceExclVat: line.unitPrice, vatRate }).lineTotalInclVat}
                  onCommit={(n) => updatePriceIncl(line.key, n, vatRate)}
                  className={cn(inputClass, "text-right")}
                  title="Prijs per stuk incl. btw (mag negatief, bv. een korting/aanbetaling-aftrek)"
                />
              ) : (
                <DecimalField
                  key={`${line.key}-excl`}
                  value={line.unitPrice}
                  onCommit={(n) => updateLine(line.key, { unitPrice: n })}
                  className={cn(inputClass, "text-right")}
                  title="Prijs per stuk excl. btw (mag negatief, bv. een korting/aanbetaling-aftrek)"
                />
              )}
              <button
                type="button"
                onClick={() => removeLine(line.key)}
                className="flex size-9 items-center justify-center justify-self-end rounded-brand-sm text-ink-400 hover:bg-red-50 hover:text-red-600 sm:justify-self-auto"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...lines, newEditableLine()])}>
          <Plus className="mr-1.5 size-4" />
          Vrije regel
        </Button>

        {catalogItems.length > 0 && (
          <div className="relative">
            <Button type="button" variant="outline" size="sm" onClick={() => setCatalogOpen((v) => !v)}>
              Uit catalogus
              <ChevronDown className="ml-1.5 size-4" />
            </Button>
            {catalogOpen && (
              <div className="absolute left-0 top-full z-20 mt-1 max-h-64 w-72 overflow-y-auto rounded-brand-sm border border-ink-200 bg-white p-1 shadow-lg">
                {catalogItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onChange([...lines, newEditableLine(item)]);
                      setCatalogOpen(false);
                    }}
                    className="flex w-full items-center justify-between gap-2 rounded-brand-sm px-2.5 py-2 text-left text-sm hover:bg-sand-100"
                  >
                    <span className="text-ink-500">{item.name}</span>
                    <span className="text-ink-400">{formatCurrency(item.unitPrice)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {lines.length > 0 && (
        <div className="flex flex-col items-end gap-1 border-t border-ink-100 pt-3 text-sm">
          <div className="flex w-56 justify-between text-ink-400">
            <span>Totaal excl. btw</span>
            <span>{formatCurrency(totals.subtotalExclVat)}</span>
          </div>
          {vatSummary.map((row) => (
            <div key={row.vatRate} className="flex w-56 justify-between text-ink-400">
              <span>Btw {row.vatRate}%</span>
              <span>{formatCurrency(row.vatAmount)}</span>
            </div>
          ))}
          <div className="flex w-56 justify-between border-t border-ink-100 pt-1 text-base font-semibold text-ink-500">
            <span>Te betalen</span>
            <span>{formatCurrency(totals.totalInclVat)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
