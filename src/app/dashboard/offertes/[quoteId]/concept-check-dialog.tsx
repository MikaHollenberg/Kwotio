"use client";

import { createPortal } from "react-dom";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Toont een checklist van waarschijnlijk-ontbrekende info (bv. geen
 * eventdatum, geen prijs) vlak voordat de offerte verstuurd wordt -- puur
 * een heads-up, geen harde blokkade: het bureau kan altijd toch doorgaan. */
export function ConceptCheckDialog({
  open,
  warnings,
  pending,
  onSendAnyway,
  onCancel,
}: {
  open: boolean;
  warnings: string[];
  pending?: boolean;
  onSendAnyway: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-500/50 p-4" onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-brand-lg bg-white p-6 shadow-2xl">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-5 text-amber-500" />
          <h2 className="font-display text-lg font-semibold text-ink-500">Nog even checken?</h2>
        </div>
        <p className="mt-2 text-sm text-ink-400">Deze offerte mist mogelijk nog wat info:</p>
        <ul className="mt-3 flex flex-col gap-1.5">
          {warnings.map((warning) => (
            <li key={warning} className="flex items-start gap-2 text-sm text-ink-500">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-500" />
              {warning}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={pending}>
            Terug naar offerte
          </Button>
          <Button variant="primary" size="sm" onClick={onSendAnyway} disabled={pending}>
            {pending ? "Bezig…" : "Toch versturen"}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
