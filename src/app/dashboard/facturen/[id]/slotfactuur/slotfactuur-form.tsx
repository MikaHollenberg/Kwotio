"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineItemsEditor, type EditableLine, type CatalogItemOption } from "@/components/invoicing/line-items-editor";
import { createSlotfactuurFromLines } from "../../actions";

export function SlotfactuurForm({
  depositInvoiceId,
  seedLines,
  vatRates,
  catalogItems,
}: {
  depositInvoiceId: string;
  seedLines: EditableLine[];
  vatRates: { hoog: number; laag: number };
  catalogItems: CatalogItemOption[];
}) {
  const [lines, setLines] = useState<EditableLine[]>(seedLines);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    if (lines.length === 0) {
      setError("Voeg minstens één regel toe.");
      return;
    }

    const resolvedLines = lines.map((line) => ({
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

    startTransition(() => createSlotfactuurFromLines(depositInvoiceId, resolvedLines));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Regels</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <LineItemsEditor lines={lines} onChange={setLines} vatRates={vatRates} catalogItems={catalogItems} />
        <div className="flex items-center gap-3">
          <Button type="button" variant="primary" onClick={submit} disabled={pending}>
            {pending ? "Bezig…" : "Slotfactuur aanmaken"}
          </Button>
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
