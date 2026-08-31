"use client";

import { useState, useTransition } from "react";
import { Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { archiveTemplate, unarchiveTemplate, deleteTemplateFromList } from "./actions";

export function TemplateRowActions({
  templateId,
  name,
  archived,
}: {
  templateId: string;
  name: string;
  archived: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        title={archived ? "Template herstellen" : "Template archiveren"}
        onClick={() =>
          startTransition(async () => {
            if (archived) await unarchiveTemplate(templateId);
            else await archiveTemplate(templateId);
          })
        }
      >
        {archived ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        title="Template verwijderen"
        onClick={() => setConfirmDelete(true)}
      >
        <Trash2 className="size-4" />
      </Button>

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
