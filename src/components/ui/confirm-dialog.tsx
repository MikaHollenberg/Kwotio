"use client";

import { createPortal } from "react-dom";
import { Button } from "./button";

/**
 * Eigen bevestigings-/melding-venster i.p.v. de native browser-confirm()/
 * alert() — die kunnen door de browser stilzwijgend geblokkeerd worden na
 * herhaald gebruik (geen foutmelding, gewoon niets), en zien er sowieso
 * minder professioneel uit dan een venster in de huisstijl van de app zelf.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Bevestigen",
  cancelLabel = "Annuleren",
  danger,
  pending,
  hideCancel,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  pending?: boolean;
  hideCancel?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-500/50 p-4"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-brand-lg bg-white p-6 shadow-2xl"
      >
        <h2 className="font-display text-lg font-semibold text-ink-500">{title}</h2>
        {description && <p className="mt-2 text-sm text-ink-400">{description}</p>}
        <div className="mt-6 flex justify-end gap-2">
          {!hideCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel} disabled={pending}>
              {cancelLabel}
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={onConfirm}
            disabled={pending}
            className={danger ? "bg-red-600 hover:bg-red-700 active:bg-red-700" : undefined}
          >
            {pending ? "Bezig…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
