"use client";

import { useEffect, useRef, useState } from "react";
import { BarChart3 } from "lucide-react";

const LINES = [
  "Cijfers verzamelen…",
  "Offertes bij elkaar optellen…",
  "Conversieratio berekenen…",
  "Bijna klaar…",
];

/** Typewriter-tekst i.p.v. een kale skeleton terwijl de statistieken
 * berekend worden -- loopt één keer door een paar luchtige regels, dan
 * blijft de laatste staan (de pagina is dan sowieso al bijna geladen). */
export function TypewriterLoading() {
  const [text, setText] = useState(LINES[0]);
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const raf = requestAnimationFrame(() => setText(LINES[LINES.length - 1]));
      return () => cancelAnimationFrame(raf);
    }

    let timeoutId: ReturnType<typeof setTimeout>;
    function typeLine(lineIndex: number) {
      const line = LINES[lineIndex];
      let charIndex = 0;
      function tick() {
        if (cancelled.current) return;
        charIndex++;
        setText(line.slice(0, charIndex));
        if (charIndex < line.length) {
          timeoutId = setTimeout(tick, 45);
        } else if (lineIndex < LINES.length - 1) {
          timeoutId = setTimeout(() => typeLine(lineIndex + 1), 650);
        }
      }
      timeoutId = setTimeout(tick, 45);
    }
    typeLine(0);

    return () => {
      cancelled.current = true;
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <BarChart3 className="kw-bob size-7 text-gold-600" />
      <p className="kw-typewriter-cursor font-display text-sm font-semibold text-ink-500">{text}</p>
    </div>
  );
}
