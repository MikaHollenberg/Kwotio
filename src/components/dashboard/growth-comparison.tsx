"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import type { MonthlySeriesPoint } from "@/lib/stats/queries";
import { formatCurrency, cn } from "@/lib/utils";

type Period = { key: string; label: string; count: number; total: number };

function groupByYear(series: MonthlySeriesPoint[]): Period[] {
  const byYear = new Map<string, { count: number; total: number }>();
  for (const p of series) {
    const year = p.monthKey.slice(0, 4);
    const entry = byYear.get(year) ?? { count: 0, total: 0 };
    entry.count += p.count;
    entry.total += p.total;
    byYear.set(year, entry);
  }
  return [...byYear.entries()]
    .map(([year, v]) => ({ key: year, label: year, ...v }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

function toMonthPeriods(series: MonthlySeriesPoint[]): Period[] {
  return series.map((p) => ({ key: p.monthKey, label: p.label, count: p.count, total: p.total }));
}

export function GrowthComparison({ series }: { series: MonthlySeriesPoint[] }) {
  const [mode, setMode] = useState<"maand" | "jaar">("jaar");
  const [periodA, setPeriodA] = useState("");
  const [periodB, setPeriodB] = useState("");

  const options = useMemo(() => (mode === "jaar" ? groupByYear(series) : toMonthPeriods(series)), [mode, series]);
  const keys = options.map((o) => o.key);

  const effectiveA = keys.includes(periodA) ? periodA : (keys[keys.length - 2] ?? keys[0] ?? "");
  const effectiveB = keys.includes(periodB) ? periodB : (keys[keys.length - 1] ?? "");

  const a = options.find((o) => o.key === effectiveA);
  const b = options.find((o) => o.key === effectiveB);

  if (options.length === 0) {
    return <p className="text-sm text-ink-400">Nog geen offertes om te vergelijken.</p>;
  }

  const diff = a && b ? b.count - a.count : 0;
  const pct = a && b && a.count > 0 ? Math.round((diff / a.count) * 100) : null;
  const trend = diff > 0 ? "up" : diff < 0 ? "down" : "flat";

  return (
    <div className="flex flex-col gap-4">
      <div className="inline-flex w-fit rounded-brand-sm border border-ink-200/60 bg-white/60 p-0.5 text-xs font-medium">
        {(["jaar", "maand"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              "rounded-[calc(var(--radius-brand-sm)_-_2px)] px-3 py-1.5 capitalize transition-colors",
              mode === m ? "bg-teal-500 text-white" : "text-ink-400 hover:text-ink-500",
            )}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-ink-400">
          Periode A
          <select
            value={effectiveA}
            onChange={(e) => setPeriodA(e.target.value)}
            className="rounded-brand-sm border border-ink-200/60 bg-white/80 px-2 py-1.5 text-sm text-ink-500"
          >
            {options.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-ink-400">
          Periode B
          <select
            value={effectiveB}
            onChange={(e) => setPeriodB(e.target.value)}
            className="rounded-brand-sm border border-ink-200/60 bg-white/80 px-2 py-1.5 text-sm text-ink-500"
          >
            {options.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {a && b && (
        <div className="rounded-brand-sm border border-ink-100 bg-white/50 p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs text-ink-400">{a.label}</p>
              <p className="font-display text-xl font-semibold text-ink-500">{a.count}</p>
            </div>
            <div
              className={cn(
                "flex flex-col items-center",
                trend === "up" && "text-emerald-600",
                trend === "down" && "text-red-500",
                trend === "flat" && "text-ink-400",
              )}
            >
              {trend === "up" && <ArrowUpRight className="size-6" />}
              {trend === "down" && <ArrowDownRight className="size-6" />}
              {trend === "flat" && <Minus className="size-6" />}
              <span className="text-sm font-semibold">{pct === null ? "—" : `${pct > 0 ? "+" : ""}${pct}%`}</span>
            </div>
            <div className="text-right">
              <p className="text-xs text-ink-400">{b.label}</p>
              <p className="font-display text-xl font-semibold text-ink-500">{b.count}</p>
            </div>
          </div>
          <p className="mt-3 border-t border-ink-100 pt-3 text-xs text-ink-400">
            Offertewaarde: {formatCurrency(a.total)} → {formatCurrency(b.total)}
          </p>
        </div>
      )}
    </div>
  );
}
