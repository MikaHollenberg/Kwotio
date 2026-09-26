"use client";

import { formatCurrency } from "@/lib/utils";

/** Toont het oude bedrag doorgestreept naast het nieuwe, met een korte
 * animatie (streep trekt zich, nieuw bedrag schuift in, kortingsbadge komt
 * daarna) i.p.v. dat het bedrag gewoon meteen anders is. Alleen zinvol
 * zolang er echt een korting is; de aanroeper beslist zelf wanneer dit
 * i.p.v. het normale bedrag getoond wordt. */
export function DiscountPrice({
  subtotal,
  total,
  currency,
  suffix,
}: {
  subtotal: number;
  total: number;
  currency: string;
  /** Bv. " p.p." -- puur tekst, geen eigen berekening. */
  suffix?: string;
}) {
  const percentOff = subtotal > 0 ? Math.round(((subtotal - total) / subtotal) * 100) : 0;

  return (
    <span className="inline-flex flex-wrap items-baseline gap-2">
      <span className="kw-discount-strike relative text-base font-medium text-ink-300">
        {formatCurrency(subtotal, currency)}
        {suffix}
      </span>
      <span className="kw-discount-new font-display text-xl font-semibold text-ink-500">
        {formatCurrency(total, currency)}
        {suffix}
      </span>
      {percentOff > 0 && <span className="kw-discount-badge rounded-full bg-green-600 px-2 py-0.5 text-[11px] font-bold text-white">-{percentOff}%</span>}
    </span>
  );
}
