"use client";

import { useEffect, useRef, useState } from "react";

/** True voor een korte periode telkens als `value` verandert (nooit bij de
 * allereerste render) -- voor een korte highlight-flits op het totaalbedrag
 * zodra iemand zelf een extra optie aan-/uitvinkt. */
export function usePriceFlash(value: number): boolean {
  const [flashing, setFlashing] = useState(false);
  const prev = useRef(value);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      prev.current = value;
      return;
    }
    if (value === prev.current) return;
    prev.current = value;
    setFlashing(true);
    const timeout = setTimeout(() => setFlashing(false), 500);
    return () => clearTimeout(timeout);
  }, [value]);

  return flashing;
}
