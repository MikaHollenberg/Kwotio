"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CalendarEvent } from "@/lib/stats/queries";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

function toDateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function EventsCalendar({ events }: { events: CalendarEvent[] }) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const eventsByDate = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    const key = e.eventDate.slice(0, 10);
    if (!eventsByDate.has(key)) eventsByDate.set(key, []);
    eventsByDate.get(key)!.push(e);
  }

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

  const today = toDateKey(new Date());

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
          const dayEvents = eventsByDate.get(key) ?? [];
          const isToday = key === today;
          return (
            <div
              key={i}
              className={cn(
                "flex min-h-14 flex-col items-center gap-0.5 rounded-brand-sm border border-transparent px-1 py-1.5 text-xs",
                isToday && "border-teal-300 bg-teal-50",
                dayEvents.length > 0 && !isToday && "bg-orange-50",
              )}
            >
              <span className={cn("font-medium", isToday ? "text-teal-700" : "text-ink-400")}>{date.getDate()}</span>
              {dayEvents.map((e) => (
                <a
                  key={e.quoteId}
                  href={`/dashboard/offertes/${e.quoteId}`}
                  title={`${e.title} — ${e.clientName ?? ""}`}
                  className="w-full truncate rounded-sm bg-orange-500 px-1 text-[10px] font-medium text-white hover:bg-orange-600"
                >
                  {e.clientName ?? e.title}
                </a>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
