"use client";

import { useState, useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ArrangementAvailabilityStatus } from "@/lib/types/database";
import { setArrangementAvailability } from "./actions";

const WEEKDAYS = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

/** Lokale (niet-UTC) datumsleutel -- zelfde bewuste patroon als
 * events-calendar.tsx/closed-date-picker.tsx elders in de app, om de
 * bekende toISOString()-tijdzoneverschuiving te vermijden. */
function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Klikken doorloopt: beschikbaar (geen rij nodig) -> bijna vol -> vol -> terug naar beschikbaar. */
const CYCLE: (ArrangementAvailabilityStatus | null)[] = [null, "bijna_vol", "vol"];

const STATUS_STYLES: Record<ArrangementAvailabilityStatus, string> = {
  beschikbaar: "",
  bijna_vol: "bg-amber-100 text-amber-800",
  vol: "bg-red-100 text-red-700",
};
const STATUS_LABELS: Record<ArrangementAvailabilityStatus, string> = {
  beschikbaar: "Beschikbaar",
  bijna_vol: "Bijna vol",
  vol: "Vol",
};

export function AvailabilityCalendar({
  arrangementId,
  initialAvailability,
}: {
  arrangementId: string;
  initialAvailability: { date: string; status: ArrangementAvailabilityStatus }[];
}) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [statusByDate, setStatusByDate] = useState<Record<string, ArrangementAvailabilityStatus>>(() =>
    Object.fromEntries(initialAvailability.map((a) => [a.date, a.status])),
  );
  const [, startTransition] = useTransition();

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const today = toDateKey(new Date());

  function handleClick(key: string) {
    const current = statusByDate[key] ?? null;
    const currentIndex = CYCLE.indexOf(current);
    const next = CYCLE[(currentIndex + 1) % CYCLE.length];

    setStatusByDate((prev) => {
      const copy = { ...prev };
      if (next) copy[key] = next;
      else delete copy[key];
      return copy;
    });
    startTransition(() => setArrangementAvailability(arrangementId, key, next));
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="font-display text-sm font-semibold capitalize text-ink-500">
          {cursor.toLocaleDateString("nl-NL", { month: "long", year: "numeric" })}
        </p>
        <div className="flex gap-1">
          <button
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            className="flex size-7 items-center justify-center rounded-brand-sm text-ink-400 hover:bg-sand-200"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            className="flex size-7 items-center justify-center rounded-brand-sm text-ink-400 hover:bg-sand-200"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-[11px] font-semibold text-ink-300">
            {d}
          </div>
        ))}
        {cells.map((date, i) => {
          if (!date) return <div key={i} />;
          const key = toDateKey(date);
          const status = statusByDate[key];
          const isToday = key === today;
          return (
            <button
              key={i}
              type="button"
              onClick={() => handleClick(key)}
              className={cn(
                "flex h-10 flex-col items-center justify-center rounded-brand-sm border border-transparent text-xs font-medium transition-all duration-200 ease-brand hover:border-ink-200",
                isToday && !status && "border-teal-300 bg-teal-50 text-teal-700",
                status && STATUS_STYLES[status],
                !status && !isToday && "text-ink-500",
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-ink-400">
        {(Object.keys(STATUS_LABELS) as ArrangementAvailabilityStatus[]).map((status) => (
          <span key={status} className="flex items-center gap-1.5">
            <span className={cn("size-3 rounded-full", STATUS_STYLES[status] || "bg-sand-200")} />
            {STATUS_LABELS[status]}
          </span>
        ))}
      </div>
    </div>
  );
}
