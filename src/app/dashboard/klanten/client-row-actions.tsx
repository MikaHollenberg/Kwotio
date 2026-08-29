"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { archiveClient, unarchiveClient, deleteClient } from "./actions";

export function ClientRowActions({
  clientId,
  name,
  archived,
}: {
  clientId: string;
  name: string;
  archived: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        title="Klant bekijken/bewerken"
        onClick={() => router.push(`/dashboard/klanten/${clientId}`)}
      >
        <Pencil className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        title={archived ? "Klant herstellen" : "Klant archiveren"}
        onClick={() =>
          startTransition(async () => {
            if (archived) await unarchiveClient(clientId);
            else await archiveClient(clientId);
          })
        }
      >
        {archived ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}
      </Button>
      <Button variant="ghost" size="sm" disabled={pending} title="Klant verwijderen" onClick={() => setConfirmDelete(true)}>
        <Trash2 className="size-4" />
      </Button>

      <ConfirmDialog
        open={confirmDelete}
        title="Klant verwijderen"
        description={`Weet je zeker dat je klant "${name}" wilt verwijderen? Dit kan niet ongedaan gemaakt worden. Offertes van deze klant blijven bestaan, maar verliezen de koppeling met dit klantprofiel.`}
        confirmLabel="Verwijderen"
        danger
        pending={pending}
        onConfirm={() =>
          startTransition(async () => {
            try {
              await deleteClient(clientId);
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
