"use client";

import { useState, useTransition } from "react";
import { Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { archiveOrganization, unarchiveOrganization, deleteOrganization } from "./actions";

export function OrganizationRowActions({
  organizationId,
  name,
  archived,
}: {
  organizationId: string;
  name: string;
  archived: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        title={archived ? "Organisatie herstellen" : "Organisatie archiveren"}
        onClick={() => (archived ? startTransition(() => unarchiveOrganization(organizationId)) : setConfirmArchive(true))}
      >
        {archived ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        title="Organisatie definitief verwijderen"
        onClick={() => setConfirmDelete(true)}
      >
        <Trash2 className="size-4" />
      </Button>

      <ConfirmDialog
        open={confirmArchive}
        title="Organisatie archiveren"
        description={`"${name}" wordt uit het standaardoverzicht gehaald. Data en gebruikers blijven bestaan — je kunt dit later ongedaan maken via het archief.`}
        confirmLabel="Archiveren"
        pending={pending}
        onConfirm={() =>
          startTransition(async () => {
            await archiveOrganization(organizationId);
            setConfirmArchive(false);
          })
        }
        onCancel={() => setConfirmArchive(false)}
      />
      <ConfirmDialog
        open={confirmDelete}
        title="Organisatie definitief verwijderen"
        description={`Weet je zeker dat je "${name}" definitief wilt verwijderen? Alle offertes, klanten en gebruikers van deze organisatie worden permanent verwijderd. Dit kan niet ongedaan gemaakt worden.`}
        confirmLabel="Definitief verwijderen"
        danger
        pending={pending}
        onConfirm={() =>
          startTransition(async () => {
            try {
              await deleteOrganization(organizationId);
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
