"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";

const WEEKDAYS = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

/** Lokale (niet-UTC) datumsleutel -- toISOString() zou bij een positieve
 * UTC-offset (bijv. Nederlandse tijd) de datum een dag terug kunnen
 * schuiven voor een lokaal-middernacht Date, wat de vergelijking met
 * closedDates (platte "YYYY-MM-DD"-strings uit de database) zou breken. */
function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Losse kalender-datumkiezer (i.p.v. een native `<input type="date">`) —
 * alleen hiermee kunnen gesloten dagen daadwerkelijk niet-selecteerbaar
 * gemaakt worden; een native date-input ondersteunt geen uitsluiting van
 * losse datums.
 */
export function ClosedDatePicker({
  value,
  onChange,
  closedDates,
}: {
  value: string;
  onChange: (value: string) => void;
  closedDates: string[];
}) {
  const closedSet = useMemo(() => new Set(closedDates), [closedDates]);
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(() => {
    const base = value ? new Date(`${value}T00:00:00`) : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7; // maandag = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const todayKey = toDateKey(new Date());

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="h-10 rounded-brand-sm border border-ink-200 bg-white px-3 text-left text-sm text-ink-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
      >
        {value ? formatDate(value) : <span className="text-ink-300">Kies een datum…</span>}
      </button>

      {open && (
        <div className="rounded-brand-sm border border-ink-200 bg-white p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold capitalize text-ink-500">
              {cursor.toLocaleDateString("nl-NL", { month: "long", year: "numeric" })}
            </p>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setCursor(new Date(year, month - 1, 1))}
                className="flex size-7 items-center justify-center rounded-brand-sm text-ink-400 hover:bg-sand-200"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
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
              const disabled = key < todayKey || closedSet.has(key);
              const isSelected = key === value;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={disabled}
                  title={closedSet.has(key) ? "Gesloten op deze datum" : undefined}
                  onClick={() => {
                    onChange(key);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex h-8 items-center justify-center rounded-brand-sm text-xs transition-colors duration-200 ease-brand",
                    disabled ? "cursor-not-allowed text-ink-200 line-through" : "text-ink-500 hover:bg-sand-200",
                    isSelected && !disabled && "bg-teal-500 text-white hover:bg-teal-500",
                  )}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          {value && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="mt-2 text-xs text-ink-400 underline hover:text-ink-500"
            >
              Datum wissen
            </button>
          )}
        </div>
      )}
    </div>
  );
}
