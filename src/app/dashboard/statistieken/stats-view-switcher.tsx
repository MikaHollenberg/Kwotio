"use client";

import { useState, type ReactNode } from "react";

/** Client-side toggle tussen de twee statistiekenweergaves -- beide
 * datasets worden server-side al opgehaald (zie page.tsx) en als kant-en-
 * klare JSX doorgegeven; hier wordt alleen bepaald welke zichtbaar is, geen
 * page-navigatie nodig. */
export function StatsViewSwitcher({
  offertesView,
  facturenView,
}: {
  offertesView: ReactNode;
  /** `null` (facturenmodule uitgeschakeld, zie lib/invoicing/feature-flag.ts)
   * laat de hele dropdown weg -- er is dan toch maar één weergave. */
  facturenView: ReactNode | null;
}) {
  const [view, setView] = useState<"offertes" | "facturen">("offertes");

  if (!facturenView) return offertesView;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <select
          value={view}
          onChange={(e) => setView(e.target.value as "offertes" | "facturen")}
          className="h-10 rounded-brand-sm border border-ink-200 bg-white px-3 text-sm font-medium text-ink-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        >
          <option value="offertes">Statistieken: Offertes</option>
          <option value="facturen">Statistieken: Facturen</option>
        </select>
      </div>
      {view === "offertes" ? offertesView : facturenView}
    </div>
  );
}
