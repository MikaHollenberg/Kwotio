"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/builder/field";

/** Naam-invoervenster voor "Opslaan als blok-template" — zelfde
 * portal-naar-body-patroon als ConfirmDialog, nodig omdat dit venster ook
 * vanuit een blokkaart binnen de (backdrop-blur-achtige) editor geopend
 * wordt. */
export function SaveAsBlockTemplateDialog({
  open,
  defaultName,
  pending,
  onSave,
  onCancel,
}: {
  open: boolean;
  defaultName: string;
  pending?: boolean;
  onSave: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(defaultName);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-500/50 p-4" onClick={onCancel}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-brand-lg bg-white p-6 shadow-2xl"
      >
        <h2 className="font-display text-lg font-semibold text-ink-500">Opslaan als blok-template</h2>
        <p className="mt-2 text-sm text-ink-400">
          Deze blok-template komt beschikbaar bij &quot;Blok toevoegen&quot; op elke offerte en template
          van je organisatie.
        </p>
        <TextInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="bijv. Standaard intro, BBQ-pakketten"
          autoFocus
          className="mt-4"
        />
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={pending}>
            Annuleren
          </Button>
          <Button variant="primary" size="sm" onClick={() => onSave(name.trim())} disabled={pending || !name.trim()}>
            {pending ? "Bezig…" : "Opslaan"}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
