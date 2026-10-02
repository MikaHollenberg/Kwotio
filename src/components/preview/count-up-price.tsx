"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";

/** Telt het bedrag soepel op van 0 naar het eindbedrag zodra het verschijnt
 * (cubic ease-out, 650ms), i.p.v. meteen het eindgetal te tonen. Bij
 * prefers-reduced-motion meteen het eindbedrag. Bedoeld voor een bedrag dat
 * pas na een klik in beeld komt (niet server-gerenderd), dus geen
 * hydration-mismatch-risico. */
export function CountUpPrice({
  amount,
  currency = "EUR",
  prefix = "",
  suffix = "",
  className,
}: {
  amount: number;
  currency?: string;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const frame = requestAnimationFrame(() => setValue(amount));
      return () => cancelAnimationFrame(frame);
    }
    const start = performance.now();
    const duration = 650;
    let frame = 0;
    function tick(now: number) {
      const t = Math.min(1, (now - start) / duration);
      setValue(amount * (1 - Math.pow(1 - t, 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [amount]);

  return (
    <span className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {prefix}
      {formatCurrency(value, currency)}
      {suffix}
    </span>
  );
}
