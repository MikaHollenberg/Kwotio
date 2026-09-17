"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Knoppengroepje met een schuivende pil-achtergrond die meeglijdt naar de
 * actieve optie, i.p.v. dat de kleur instant verspringt (Kwotio Motion
 * Concepts #20/#21 -- prijsweergave- en btw-toggle). Generiek genoeg voor elk
 * 2-of-meer-opties-knoppengroepje met content-brede knoppen. */
export function SegmentedToggle<T extends string>({
  value,
  options,
  onChange,
  className,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Map<T, HTMLButtonElement>>(new Map());
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const activeBtn = btnRefs.current.get(value);
    if (!container || !activeBtn) {
      setPill(null);
      return;
    }
    setPill({ left: activeBtn.offsetLeft, width: activeBtn.offsetWidth });
  }, [value, options]);

  return (
    <div ref={containerRef} className={cn("relative inline-flex gap-1 -ml-1 -mt-0.5", className)}>
      {pill && (
        <div
          aria-hidden
          className="absolute inset-y-0 z-0 rounded-brand-sm bg-blue-500 transition-all duration-300 ease-brand"
          style={{ left: pill.left, width: pill.width }}
        />
      )}
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          ref={(el) => {
            if (el) btnRefs.current.set(option.value, el);
            else btnRefs.current.delete(option.value);
          }}
          onClick={() => onChange(option.value)}
          className={cn(
            "relative z-10 rounded-brand-sm px-2 py-1 text-xs font-medium transition-colors duration-200 ease-brand",
            value === option.value ? "text-white" : "text-ink-400 hover:bg-sand-200",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
