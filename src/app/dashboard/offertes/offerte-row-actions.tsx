"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { QuoteStatus } from "@/lib/types/database";
import { OfferteEditLink } from "./offerte-edit-link";
import { deleteQuote } from "./actions";

export function OfferteRowActions({
  quoteId,
  title,
  status,
}: {
  quoteId: string;
  title: string;
  status: QuoteStatus;
}) {
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteQuote(quoteId);
        setConfirmOpen(false);
      } catch {
        setConfirmOpen(false);
        setError("Kon de offerte niet verwijderen. Probeer het opnieuw of neem contact op als dit blijft gebeuren.");
      }
    });
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <OfferteEditLink
        quoteId={quoteId}
        status={status}
        title="Offerte bewerken"
        className="flex size-8 items-center justify-center rounded-brand-sm text-ink-400 hover:bg-sand-200 hover:text-ink-500"
      >
        <Pencil className="size-4" />
      </OfferteEditLink>
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        title="Offerte verwijderen"
        onClick={() => setConfirmOpen(true)}
      >
        <Trash2 className="size-4" />
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        title="Offerte verwijderen"
        description={`Weet je zeker dat je de offerte "${title}" wilt verwijderen? Dit kan niet ongedaan gemaakt worden.`}
        confirmLabel="Verwijderen"
        danger
        pending={pending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
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
