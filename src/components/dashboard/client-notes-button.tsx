"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Alleen gerenderd door de aanroeper als er ook echt een notitie is —
 * zelfde portal-naar-body-patroon als ConfirmDialog. */
export function ClientNotesButton({ clientName, notes }: { clientName: string; notes: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Interne notities bekijken"
        className="flex size-8 items-center justify-center rounded-brand-sm text-ink-400 hover:bg-sand-200 hover:text-ink-500"
      >
        <MessageSquareText className="size-4" />
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink-500/50 p-4"
            onClick={() => setOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-brand-lg bg-white p-6 shadow-2xl"
            >
              <h2 className="font-display text-lg font-semibold text-ink-500">Interne notities</h2>
              <p className="mt-1 text-sm text-ink-400">{clientName}</p>
              <p className="mt-4 whitespace-pre-wrap text-sm text-ink-500">{notes}</p>
              <div className="mt-6 flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  Sluiten
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
