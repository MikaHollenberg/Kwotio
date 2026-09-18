"use client";

import { useEffect, useState } from "react";

export type CountUpFormat = "int" | "percent" | "decimal1";

function formatValue(n: number, format: CountUpFormat): string {
  switch (format) {
    case "percent":
      return `${Math.round(n)}%`;
    case "decimal1":
      return `${n.toFixed(1)}d`;
    case "int":
    default:
      return String(Math.round(n));
  }
}

/** Telt een KPI-getal bij het laden van de pagina vanaf 0 naar zijn waarde
 * op, i.p.v. het eindgetal meteen plat neer te zetten (Kwotio Motion
 * Concepts #7). Puur cosmetisch -- de server berekent de echte waarde, dit
 * component animeert alleen de weergave ervan.
 *
 * `format` is bewust een vaste string ("int"/"percent"/"decimal1"), geen
 * callback-functie -- een Server Component mag geen functie als prop
 * doorgeven aan een Client Component (niet serialiseerbaar over de RSC-
 * grens). Dat werkt in `next dev` per ongeluk stilzwijgend, maar breekt in
 * een echte productie-build ("Functions cannot be passed directly to
 * Client Components") -- hier zelf tegenaan gelopen op de live site. */
export function CountUpValue({
  value,
  format,
  durationMs = 900,
}: {
  value: number;
  format: CountUpFormat;
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

  return <>{formatValue(display, format)}</>;
}
