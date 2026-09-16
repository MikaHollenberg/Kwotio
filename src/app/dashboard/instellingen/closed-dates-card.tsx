"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";
import { addClosedDate, addClosedDateRange, deleteClosedDate, updateClosedWeekdays } from "./actions";

const inputClass =
  "h-10 rounded-brand-sm border border-ink-200 bg-white px-3 text-sm text-ink-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 disabled:opacity-60";

const WEEKDAY_LABELS = [
  { value: 0, label: "Zo" },
  { value: 1, label: "Ma" },
  { value: 2, label: "Di" },
  { value: 3, label: "Wo" },
  { value: 4, label: "Do" },
  { value: 5, label: "Vr" },
  { value: 6, label: "Za" },
];

export type ClosedDate = { id: string; date: string; reason: string | null };

export function ClosedDatesCard({
  closedDates,
  closedWeekdays,
  canEdit,
}: {
  closedDates: ClosedDate[];
  /** organizations.closed_weekdays -- 0 = zondag .. 6 = zaterdag. */
  closedWeekdays: number[];
  canEdit: boolean;
}) {
  const [mode, setMode] = useState<"single" | "range">("single");
  const [date, setDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [addPending, startAddTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletePending, startDeleteTransition] = useTransition();
  const [weekdays, setWeekdays] = useState<number[]>(closedWeekdays);
  const [weekdaysPending, startWeekdaysTransition] = useTransition();

  const sorted = [...closedDates].sort((a, b) => a.date.localeCompare(b.date));

  function submit() {
    setError(null);
    if (!date) {
      setError("Kies een datum.");
      return;
    }
    if (mode === "range" && !endDate) {
      setError("Kies ook een einddatum.");
      return;
    }
    startAddTransition(async () => {
      try {
        if (mode === "range") {
          await addClosedDateRange(date, endDate, reason);
        } else {
          await addClosedDate(date, reason);
        }
        setDate("");
        setEndDate("");
        setReason("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Opslaan mislukt.");
      }
    });
  }

  function toggleWeekday(value: number) {
    const next = weekdays.includes(value) ? weekdays.filter((d) => d !== value) : [...weekdays, value];
    setWeekdays(next);
    startWeekdaysTransition(() => updateClosedWeekdays(next));
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
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-ink-400">Vaste gesloten dag(en) in de week</p>
          <div className="flex flex-wrap gap-1.5">
            {WEEKDAY_LABELS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                disabled={!canEdit || weekdaysPending}
                onClick={() => toggleWeekday(value)}
                className={cn(
                  "flex size-9 items-center justify-center rounded-full border text-xs font-semibold transition-colors duration-200 ease-brand disabled:opacity-60",
                  weekdays.includes(value)
                    ? "border-teal-500 bg-teal-500 text-white"
                    : "border-ink-200 text-ink-400 hover:border-ink-300 hover:text-ink-500",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-ink-100 pt-4">
          {canEdit && (
            <>
              <div className="mb-3 flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setMode("single")}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-semibold transition-colors duration-200 ease-brand",
                    mode === "single" ? "border-teal-500 bg-teal-500 text-white" : "border-ink-200 text-ink-400 hover:border-ink-300",
                  )}
                >
                  Losse datum
                </button>
                <button
                  type="button"
                  onClick={() => setMode("range")}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-semibold transition-colors duration-200 ease-brand",
                    mode === "range" ? "border-teal-500 bg-teal-500 text-white" : "border-ink-200 text-ink-400 hover:border-ink-300",
                  )}
                >
                  Periode
                </button>
              </div>
              <form
                className="flex flex-wrap items-end gap-3"
                data-faq-id="settings-closed-dates-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
              >
                <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-400">
                  {mode === "range" ? "Vanaf" : "Datum"}
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={inputClass}
                  />
                </label>
                {mode === "range" && (
                  <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-400">
                    Tot en met
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className={inputClass}
                    />
                  </label>
                )}
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
            </>
          )}
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>

        {sorted.length === 0 ? (
          <p className="text-sm text-ink-400">Nog geen losse gesloten dagen ingesteld.</p>
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
