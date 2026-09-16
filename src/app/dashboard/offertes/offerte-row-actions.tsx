"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Eye, Pencil, Copy, Trash2, UserPlus, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { QuoteStatus } from "@/lib/types/database";
import { OfferteEditLink } from "./offerte-edit-link";
import { deleteQuote, duplicateQuote } from "./actions";

export function OfferteRowActions({
  quoteId,
  title,
  status,
  shareToken,
}: {
  quoteId: string;
  title: string;
  status: QuoteStatus;
  shareToken: string;
}) {
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicatePending, startDuplicateTransition] = useTransition();
  const [duplicateMenuOpen, setDuplicateMenuOpen] = useState(false);
  const duplicateMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (duplicateMenuRef.current && !duplicateMenuRef.current.contains(e.target as Node)) {
        setDuplicateMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleDuplicate(sameClientNextYear: boolean) {
    setDuplicateMenuOpen(false);
    startDuplicateTransition(() => duplicateQuote(quoteId, { sameClientNextYear }));
  }

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
      <a
        href={`/offerte/${shareToken}`}
        target="_blank"
        rel="noopener noreferrer"
        title="Offerte bekijken zoals de klant"
        className="flex size-8 items-center justify-center rounded-brand-sm text-ink-400 hover:bg-sand-200 hover:text-ink-500"
      >
        <Eye className="size-4" />
      </a>
      <OfferteEditLink
        quoteId={quoteId}
        status={status}
        title="Offerte bewerken"
        className="flex size-8 items-center justify-center rounded-brand-sm text-ink-400 hover:bg-sand-200 hover:text-ink-500"
      >
        <Pencil className="size-4" />
      </OfferteEditLink>
      <div ref={duplicateMenuRef} className="relative">
        <Button
          variant="ghost"
          size="sm"
          disabled={duplicatePending}
          title="Offerte dupliceren"
          data-faq-id={`duplicate-quote-button-${quoteId}`}
          onClick={() => setDuplicateMenuOpen((v) => !v)}
        >
          <Copy className="size-4" />
        </Button>
        {duplicateMenuOpen && (
          <div className="absolute right-0 top-full z-20 mt-1 w-64 rounded-brand-sm border border-ink-200 bg-white p-1.5 shadow-lg">
            <button
              type="button"
              onClick={() => handleDuplicate(false)}
              className="flex w-full items-start gap-2.5 rounded-brand-sm px-3 py-2 text-left text-sm text-ink-500 transition-colors duration-200 ease-brand hover:bg-sand-200"
            >
              <UserPlus className="mt-0.5 size-4 shrink-0 text-ink-400" />
              <span>
                <span className="block font-medium">Voor een nieuwe klant</span>
                <span className="block text-xs text-ink-400">Zonder klant en datum, klaar om in te vullen</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleDuplicate(true)}
              className="flex w-full items-start gap-2.5 rounded-brand-sm px-3 py-2 text-left text-sm text-ink-500 transition-colors duration-200 ease-brand hover:bg-sand-200"
            >
              <CalendarClock className="mt-0.5 size-4 shrink-0 text-ink-400" />
              <span>
                <span className="block font-medium">Voor dezelfde klant (volgend jaar)</span>
                <span className="block text-xs text-ink-400">Klant en datum (+1 jaar) worden meegenomen</span>
              </span>
            </button>
          </div>
        )}
      </div>
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
