"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineItemsEditor, type EditableLine, type CatalogItemOption } from "@/components/invoicing/line-items-editor";
import { updateInvoiceLines } from "../actions";

/**
 * Vervangt de statische regel-tabel zolang een factuur nog `concept` is --
 * zodra 'm verstuurd/betaald is, toont de detailpagina weer de gewone
 * alleen-lezen weergave (zie page.tsx).
 */
export function EditInvoiceLinesCard({
  invoiceId,
  initialLines,
  vatRates,
  catalogItems,
}: {
  invoiceId: string;
  initialLines: EditableLine[];
  vatRates: { hoog: number; laag: number };
  catalogItems: CatalogItemOption[];
}) {
  const [lines, setLines] = useState<EditableLine[]>(initialLines);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setSaved(false);
    setError(null);
    if (lines.length === 0) {
      setError("Een factuur moet minstens één regel hebben.");
      return;
    }
    startTransition(async () => {
      try {
        await updateInvoiceLines(
          invoiceId,
          lines.map((line) => ({
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
          })),
        );
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Opslaan mislukt.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Regels (concept — nog te bewerken)</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <LineItemsEditor lines={lines} onChange={setLines} vatRates={vatRates} catalogItems={catalogItems} />
        <div className="flex items-center gap-3">
          <Button type="button" variant="primary" size="sm" onClick={save} disabled={pending}>
            {pending ? "Bezig…" : "Wijzigingen opslaan"}
          </Button>
          {saved && <span className="text-xs text-teal-700">Opgeslagen</span>}
          {error && <span className="text-xs text-red-600">{error}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
