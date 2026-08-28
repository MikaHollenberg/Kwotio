"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { QuoteStatus } from "@/lib/types/database";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { notifySignerOfEdit } from "./actions";

/**
 * Titel-link en bewerk-icoon in de offertelijst gaan allebei naar dezelfde
 * editor (geen apart "bekijk"-only-modus) — daarom hier gedeeld: bij een
 * al-geaccepteerde offerte eerst een bevestiging, en bij bevestigen wordt de
 * klant die getekend heeft eenmalig geïnformeerd dat het bureau de offerte
 * aanpast.
 */
export function OfferteEditLink({
  quoteId,
  status,
  className,
  title,
  children,
}: {
  quoteId: string;
  status: QuoteStatus;
  className?: string;
  title?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function goToEditor() {
    router.push(`/dashboard/offertes/${quoteId}`);
  }

  return (
    <>
      <a
        href={`/dashboard/offertes/${quoteId}`}
        title={title}
        className={className}
        onClick={(e) => {
          e.preventDefault();
          if (status === "geaccepteerd") {
            setConfirmOpen(true);
            return;
          }
          goToEditor();
        }}
      >
        {children}
      </a>

      <ConfirmDialog
        open={confirmOpen}
        title="Offerte aanpassen?"
        description="Deze offerte is al geaccepteerd door de klant. De klant die getekend heeft krijgt een melding dat de offerte is aangepast."
        confirmLabel="Ja, aanpassen"
        onConfirm={() => {
          setConfirmOpen(false);
          void notifySignerOfEdit(quoteId);
          goToEditor();
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
