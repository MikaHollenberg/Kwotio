"use client";

import { useRouter } from "next/navigation";
import type { Quarter } from "@/lib/invoicing/vat-return";

/** Springt naar een ander jaar/kwartaal via de URL (?jaar=&kwartaal=) --
 * Server Component page.tsx leest die en haalt het bijbehorende overzicht
 * vers op, dus geen client-side state nodig voor de data zelf. */
export function QuarterPicker({ year, quarter, years }: { year: number; quarter: Quarter; years: number[] }) {
  const router = useRouter();

  function go(nextYear: number, nextQuarter: Quarter) {
    router.push(`/dashboard/administratie?jaar=${nextYear}&kwartaal=${nextQuarter}`);
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={year}
        onChange={(e) => go(Number(e.target.value), quarter)}
        className="h-9 rounded-brand-sm border border-ink-200 bg-white px-2.5 text-sm text-ink-500 outline-none focus:border-teal-500"
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
      <select
        value={quarter}
        onChange={(e) => go(year, Number(e.target.value) as Quarter)}
        className="h-9 rounded-brand-sm border border-ink-200 bg-white px-2.5 text-sm text-ink-500 outline-none focus:border-teal-500"
      >
        {[1, 2, 3, 4].map((q) => (
          <option key={q} value={q}>
            Q{q}
          </option>
        ))}
      </select>
    </div>
  );
}
