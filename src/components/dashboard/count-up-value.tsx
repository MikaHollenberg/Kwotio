"use client";

import { useEffect, useState } from "react";

/** Telt een KPI-getal bij het laden van de pagina vanaf 0 naar zijn waarde
 * op, i.p.v. het eindgetal meteen plat neer te zetten (Kwotio Motion
 * Concepts #7). Puur cosmetisch -- de server berekent de echte waarde, dit
 * component animeert alleen de weergave ervan. */
export function CountUpValue({
  value,
  format,
  durationMs = 900,
}: {
  value: number;
  format: (n: number) => string;
  durationMs?: number;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    function step(now: number) {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * eased);
      if (progress < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, durationMs]);

  return <>{format(display)}</>;
}
