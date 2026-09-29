"use client";

import { useState, useTransition } from "react";
import { Archive, ArchiveRestore, Copy, Trash2 } from "lucide-react";
import { ActionIconButton } from "@/components/dashboard/action-icon-button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { archiveTemplate, unarchiveTemplate, deleteTemplateFromList, duplicateTemplate } from "./actions";

export function TemplateRowActions({
  templateId,
  name,
  archived,
  onArchived,
  onUnarchived,
  onDeleted,
}: {
  templateId: string;
  name: string;
  archived: boolean;
  /** Optioneel: laat de aanroepende lijst het kaartje netjes laten
   * wegkrimpen i.p.v. in één klap te verdwijnen bij de volgende revalidatie. */
  onArchived?: () => void;
  onUnarchived?: () => void;
  onDeleted?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center justify-end gap-1">
      <ActionIconButton icon={Copy} title="Dupliceren" onAction={() => duplicateTemplate(templateId)} />
      <ActionIconButton
        icon={archived ? ArchiveRestore : Archive}
        title={archived ? "Template herstellen" : "Template archiveren"}
        onAction={async () => {
          if (archived) {
            await unarchiveTemplate(templateId);
            onUnarchived?.();
          } else {
            await archiveTemplate(templateId);
            onArchived?.();
          }
        }}
      />
      <button
        type="button"
        title="Template verwijderen"
        aria-label="Template verwijderen"
        onClick={() => setConfirmDelete(true)}
        className="flex size-8 items-center justify-center rounded-brand-sm text-ink-400 transition-colors duration-200 ease-brand hover:bg-sand-200 hover:text-ink-500"
      >
        <Trash2 className="size-4" />
      </button>

      <ConfirmDialog
        open={confirmDelete}
        title="Template verwijderen"
        description={`Weet je zeker dat je template "${name}" wilt verwijderen? Dit kan niet ongedaan gemaakt worden. Offertes die al met dit template gemaakt zijn blijven gewoon bestaan.`}
        confirmLabel="Verwijderen"
        danger
        pending={pending}
        onConfirm={() =>
          startTransition(async () => {
            try {
              await deleteTemplateFromList(templateId);
              setConfirmDelete(false);
              onDeleted?.();
            } catch {
              setConfirmDelete(false);
              setError("Verwijderen mislukt. Probeer het opnieuw.");
            }
          })
        }
        onCancel={() => setConfirmDelete(false)}
      />
      <ConfirmDialog
        open={!!error}
        title="Verwijderen mislukt"
        description={error ?? ""}
        confirmLabel="Oké"
        hideCancel
        onConfirm={() => setError(null)}
        onCancel={() => setError(null)}
      />
    </div>
  );
}
