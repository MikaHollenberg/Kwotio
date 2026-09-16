"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { InvoiceStatus } from "@/lib/types/database";
import { deleteInvoice } from "./actions";

/** Spiegelt `offerte-row-actions.tsx` (zelfde patroon: potlood + prullenbak +
 * ConfirmDialog) -- verwijderen kan hier alleen bij een conceptfactuur, zie
 * `deleteInvoice()` en migratie 0062. */
export function InvoiceRowActions({ invoiceId, invoiceNumber, status }: { invoiceId: string; invoiceNumber: string; status: InvoiceStatus }) {
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteInvoice(invoiceId);
        setConfirmOpen(false);
      } catch (err) {
        setConfirmOpen(false);
        setError(err instanceof Error ? err.message : "Kon de factuur niet verwijderen. Probeer het opnieuw.");
      }
    });
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        href={`/dashboard/facturen/${invoiceId}`}
        title="Factuur bewerken"
        className="flex size-8 items-center justify-center rounded-brand-sm text-ink-400 hover:bg-sand-200 hover:text-ink-500"
      >
        <Pencil className="size-4" />
      </Link>
      {status === "concept" && (
        <Button variant="ghost" size="sm" disabled={pending} title="Factuur verwijderen" onClick={() => setConfirmOpen(true)}>
          <Trash2 className="size-4" />
        </Button>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Factuur verwijderen"
        description={`Weet je zeker dat je conceptfactuur "${invoiceNumber}" wilt verwijderen? Dit kan niet ongedaan gemaakt worden.`}
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
