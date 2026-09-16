"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createInvoiceFromQuote } from "@/app/dashboard/facturen/actions";
import type { DepositMode } from "@/lib/invoicing/deposit";

/**
 * Gedeelde "Factuur aanmaken"-dialoog voor een geaccepteerde offerte --
 * gebruikt door zowel `CreateInvoiceCard` (offerte-detailpagina) als
 * `OfferteRowActions` (offertes-lijst, snelkoppeling zonder eerst de offerte
 * te hoeven openen). `createInvoiceFromQuote` redirect zelf naar de nieuwe
 * factuur bij succes, dus bewust geen try/catch hier omheen (zou de interne
 * redirect-exception opvangen als een fout).
 */
export function CreateInvoiceModal({ quoteId, open, onClose }: { quoteId: string; open: boolean; onClose: () => void }) {
  const [kind, setKind] = useState<"volledig" | "aanbetaling">("volledig");
  const [mode, setMode] = useState<DepositMode>("percentage");
  const [value, setValue] = useState("30");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    if (kind === "volledig") {
      startTransition(() => createInvoiceFromQuote(quoteId, { kind: "volledig" }));
      return;
    }
    const numericValue = Number(value.replace(",", "."));
    if (!numericValue || numericValue <= 0) {
      setError("Vul een geldig bedrag of percentage in.");
      return;
    }
    if (mode === "percentage" && numericValue > 100) {
      setError("Een percentage kan niet hoger dan 100 zijn.");
      return;
    }
    startTransition(() => createInvoiceFromQuote(quoteId, { kind: "aanbetaling", mode, value: numericValue }));
  }

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-500/50 p-4" onClick={() => !pending && onClose()}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-brand-lg bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <h2 className="font-display text-lg font-semibold text-ink-500">Factuur aanmaken</h2>
          <button
            onClick={onClose}
            disabled={pending}
            className="flex size-8 items-center justify-center rounded-brand-sm text-ink-400 hover:bg-sand-200"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setKind("volledig")}
              className={cn(
                "flex-1 rounded-brand-sm border px-3 py-2 text-xs font-semibold transition-colors duration-200 ease-brand",
                kind === "volledig" ? "border-teal-500 bg-teal-500 text-white" : "border-ink-200 text-ink-400 hover:border-ink-300",
              )}
            >
              Volledige factuur
            </button>
            <button
              type="button"
              onClick={() => setKind("aanbetaling")}
              className={cn(
                "flex-1 rounded-brand-sm border px-3 py-2 text-xs font-semibold transition-colors duration-200 ease-brand",
                kind === "aanbetaling" ? "border-teal-500 bg-teal-500 text-white" : "border-ink-200 text-ink-400 hover:border-ink-300",
              )}
            >
              Aanbetaling
            </button>
          </div>

          {kind === "aanbetaling" && (
            <div className="flex flex-col gap-3">
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setMode("percentage")}
                  className={cn(
                    "flex-1 rounded-full border px-3 py-1 text-xs font-semibold",
                    mode === "percentage" ? "border-teal-500 bg-teal-500 text-white" : "border-ink-200 text-ink-400",
                  )}
                >
                  Percentage
                </button>
                <button
                  type="button"
                  onClick={() => setMode("fixed")}
                  className={cn(
                    "flex-1 rounded-full border px-3 py-1 text-xs font-semibold",
                    mode === "fixed" ? "border-teal-500 bg-teal-500 text-white" : "border-ink-200 text-ink-400",
                  )}
                >
                  Vast bedrag
                </button>
              </div>
              <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-400">
                {mode === "percentage" ? "Percentage van het totaal (incl. btw)" : "Bedrag incl. btw"}
                <input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  inputMode="decimal"
                  className="h-10 rounded-brand-sm border border-ink-200 bg-white px-3 text-sm text-ink-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
              </label>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={pending}>
            Annuleren
          </Button>
          <Button variant="primary" size="sm" onClick={submit} disabled={pending}>
            {pending ? "Bezig…" : "Factuur aanmaken"}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
