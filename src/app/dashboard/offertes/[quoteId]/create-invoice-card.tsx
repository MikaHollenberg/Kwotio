"use client";

import { useState } from "react";
import { Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, ButtonLink } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CreateInvoiceModal } from "@/components/invoicing/create-invoice-modal";

/**
 * Alleen getoond bij een geaccepteerde offerte (zie quote-editor.tsx). Zet de
 * offerte om in een factuur -- volledig, of eerst een aanbetaling (vast
 * bedrag/percentage, btw direct berekend). `createInvoiceFromQuote` redirect
 * zelf naar de nieuwe factuur bij succes, dus bewust geen try/catch hier
 * omheen (zou de interne redirect-exception opvangen als een fout) --
 * duidelijke invoerfouten (leeg/ongeldig percentage) worden client-side
 * afgevangen vóór de server-actie wordt aangeroepen. "Maak slotfactuur" is
 * een link naar een eigen pagina (vanaf 0 de definitieve regels invullen).
 */
export function CreateInvoiceCard({
  quoteId,
  depositInvoiceId,
  depositAmount,
  depositPaidAt,
  hasSlotfactuur,
}: {
  quoteId: string;
  depositInvoiceId: string | null;
  depositAmount: number | null;
  depositPaidAt: string | null;
  hasSlotfactuur: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Card data-faq-id="quote-create-invoice-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Receipt className="size-4 text-teal-600" />
          <CardTitle>Facturatie</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {depositPaidAt && (
          <p className="text-sm text-ink-500">
            Aanbetaald: <span className="font-semibold">{formatCurrency(depositAmount ?? 0)}</span> op{" "}
            {formatDate(depositPaidAt)}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
            Maak factuur van deze offerte
          </Button>
          {depositPaidAt && !hasSlotfactuur && depositInvoiceId && (
            <ButtonLink href={`/dashboard/facturen/${depositInvoiceId}/slotfactuur`} variant="outline" size="sm">
              Maak slotfactuur
            </ButtonLink>
          )}
        </div>
      </CardContent>

      <CreateInvoiceModal quoteId={quoteId} open={open} onClose={() => setOpen(false)} />
    </Card>
  );
}
