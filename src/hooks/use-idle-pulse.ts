"use client";

import { useEffect, useRef, useState } from "react";

/** True zodra de bezoeker een tijdje niets heeft gedaan (geen muis/toets/
 * touch/scroll) -- voor een zachte adem-pulsatie op een CTA die anders over
 * het hoofd gezien kan worden. Reset meteen bij de eerstvolgende interactie. */
export function useIdlePulse(delayMs = 8000): boolean {
  const [idle, setIdle] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function armTimer() {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setIdle(true), delayMs);
    }
    function handleActivity() {
      setIdle(false);
      armTimer();
    }
    armTimer();
    const events = ["mousemove", "keydown", "touchstart", "scroll"] as const;
    events.forEach((e) => window.addEventListener(e, handleActivity, { passive: true }));
    return () => {
      events.forEach((e) => window.removeEventListener(e, handleActivity));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [delayMs]);

  return idle;
}
