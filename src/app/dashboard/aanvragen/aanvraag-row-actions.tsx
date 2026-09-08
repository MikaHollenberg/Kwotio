"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteQuoteRequest } from "./actions";

export function AanvraagRowActions({ requestId, customerName }: { requestId: string; customerName: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        title="Aanvraag bekijken"
        onClick={() => router.push(`/dashboard/aanvragen/${requestId}`)}
      >
        <Eye className="size-4" />
      </Button>
      <Button variant="ghost" size="sm" disabled={pending} title="Aanvraag verwijderen" onClick={() => setConfirmDelete(true)}>
        <Trash2 className="size-4" />
      </Button>

      <ConfirmDialog
        open={confirmDelete}
        title="Aanvraag verwijderen"
        description={`Weet je zeker dat je de aanvraag van "${customerName}" wilt verwijderen? Dit kan niet ongedaan gemaakt worden.`}
        confirmLabel="Verwijderen"
        danger
        pending={pending}
        onConfirm={() =>
          startTransition(async () => {
            try {
              await deleteQuoteRequest(requestId);
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
