"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRightCircle, Ban, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { convertQuoteRequestToQuote, updateQuoteRequestStatus, deleteQuoteRequest } from "../actions";
import type { QuoteRequestStatus } from "@/lib/types/database";

export function RequestDetailActions({
  requestId,
  customerName,
  status,
  convertedQuoteId,
}: {
  requestId: string;
  customerName: string;
  status: QuoteRequestStatus;
  convertedQuoteId: string | null;
}) {
  const router = useRouter();
  const [convertPending, startConvertTransition] = useTransition();
  const [ignorePending, startIgnoreTransition] = useTransition();
  const [ignoreConfirmOpen, setIgnoreConfirmOpen] = useState(false);
  const [deletePending, startDeleteTransition] = useTransition();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const alreadyConverted = status === "omgezet";
  const ignored = status === "genegeerd";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Acties</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-3">
        {alreadyConverted && convertedQuoteId ? (
          <Link href={`/dashboard/offertes/${convertedQuoteId}`} className="text-sm font-medium text-teal-600 hover:text-teal-700">
            Bekijk de offerte die van deze aanvraag is gemaakt →
          </Link>
        ) : (
          <Button
            disabled={convertPending || ignored}
            onClick={() => startConvertTransition(() => convertQuoteRequestToQuote(requestId))}
          >
            <ArrowRightCircle className="size-4" />
            {convertPending ? "Bezig…" : "Omzetten naar offerte"}
          </Button>
        )}

        {!alreadyConverted && !ignored && (
          <Button
            variant="outline"
            disabled={ignorePending}
            onClick={() => setIgnoreConfirmOpen(true)}
          >
            <Ban className="size-4" />
            Markeer als afgehandeld/genegeerd
          </Button>
        )}

        <Button
          variant="ghost"
          disabled={deletePending}
          onClick={() => setDeleteConfirmOpen(true)}
          className="text-red-600 hover:bg-red-50"
        >
          <Trash2 className="size-4" />
          Verwijderen
        </Button>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <ConfirmDialog
          open={ignoreConfirmOpen}
          title="Aanvraag markeren als afgehandeld"
          description="De aanvraag wordt gemarkeerd als genegeerd/afgehandeld — handig bij een dubbele of duidelijk foutieve aanvraag."
          confirmLabel="Markeren"
          pending={ignorePending}
          onConfirm={() => {
            startIgnoreTransition(async () => {
              try {
                await updateQuoteRequestStatus(requestId, "genegeerd");
                setIgnoreConfirmOpen(false);
              } catch {
                setIgnoreConfirmOpen(false);
                setError("Bijwerken mislukt. Probeer het opnieuw.");
              }
            });
          }}
          onCancel={() => setIgnoreConfirmOpen(false)}
        />
        <ConfirmDialog
          open={deleteConfirmOpen}
          title="Aanvraag verwijderen"
          description={`Weet je zeker dat je de aanvraag van "${customerName}" wilt verwijderen? Dit kan niet ongedaan gemaakt worden.`}
          confirmLabel="Verwijderen"
          danger
          pending={deletePending}
          onConfirm={() => {
            startDeleteTransition(async () => {
              try {
                await deleteQuoteRequest(requestId);
                router.push("/dashboard/aanvragen");
              } catch {
                setDeleteConfirmOpen(false);
                setError("Verwijderen mislukt. Probeer het opnieuw.");
              }
            });
          }}
          onCancel={() => setDeleteConfirmOpen(false)}
        />
      </CardContent>
    </Card>
  );
}
