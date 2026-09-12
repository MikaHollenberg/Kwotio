"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { addClosedDate, deleteClosedDate } from "./actions";

const inputClass =
  "h-10 rounded-brand-sm border border-ink-200 bg-white px-3 text-sm text-ink-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 disabled:opacity-60";

export type ClosedDate = { id: string; date: string; reason: string | null };

export function ClosedDatesCard({ closedDates, canEdit }: { closedDates: ClosedDate[]; canEdit: boolean }) {
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [addPending, startAddTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletePending, startDeleteTransition] = useTransition();

  const sorted = [...closedDates].sort((a, b) => a.date.localeCompare(b.date));

  function submit() {
    setError(null);
    if (!date) {
      setError("Kies een datum.");
      return;
    }
    startAddTransition(async () => {
      try {
        await addClosedDate(date, reason);
        setDate("");
        setReason("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Opslaan mislukt.");
      }
    });
  }

  return (
    <Card data-faq-id="settings-gesloten-dagen">
      <CardHeader>
        <div>
          <CardTitle>Gesloten dagen</CardTitle>
          <CardDescription>
            Data waarop jullie sowieso dicht zijn — een klant kan deze datum niet kiezen als
            gewenste datum op de publieke aanvraagpagina.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {canEdit && (
          <form
            className="flex flex-wrap items-end gap-3"
            data-faq-id="settings-closed-dates-form"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-400">
              Datum
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-400">
              Reden (optioneel)
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="bijv. Kerstvakantie"
                className={inputClass}
              />
            </label>
            <Button type="submit" variant="outline" size="sm" disabled={addPending}>
              {addPending ? "Bezig…" : "Toevoegen"}
            </Button>
          </form>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {sorted.length === 0 ? (
          <p className="text-sm text-ink-400">Nog geen gesloten dagen ingesteld.</p>
        ) : (
          <div className="flex flex-col divide-y divide-ink-50">
            {sorted.map((cd) => (
              <div key={cd.id} className="flex items-center justify-between gap-3 py-2">
                <div className="text-sm">
                  <span className="font-medium text-ink-500">{formatDate(cd.date)}</span>
                  {cd.reason && <span className="ml-2 text-ink-400">— {cd.reason}</span>}
                </div>
                {canEdit && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={deletePending && deletingId === cd.id}
                    onClick={() => {
                      setDeletingId(cd.id);
                      startDeleteTransition(() => deleteClosedDate(cd.id));
                    }}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
