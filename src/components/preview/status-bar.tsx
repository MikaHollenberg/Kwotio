"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import type { QuoteStatus } from "@/lib/types/database";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/language-context";
import type { TranslationKey } from "@/lib/i18n/translations";

const STEPS: { status: QuoteStatus; labelKey: TranslationKey }[] = [
  { status: "verzonden", labelKey: "status_verzonden" },
  { status: "bekeken", labelKey: "status_bekeken" },
  { status: "in_overleg", labelKey: "status_in_overleg" },
  { status: "geaccepteerd", labelKey: "status_geaccepteerd" },
];

const STEP_ORDER: Record<QuoteStatus, number> = {
  concept: -1,
  verzonden: 0,
  bekeken: 1,
  in_overleg: 2,
  geaccepteerd: 3,
  verlopen: 3,
  geweigerd: 3,
};

export function StatusBar({ status, accentColor }: { status: QuoteStatus; accentColor: string }) {
  const { t } = useTranslation();
  // Laat voltooide stappen bij het laden van de pagina "intekenen" i.p.v.
  // meteen al gevuld te staan -- pas ná de eerste render naar de echte
  // status omschakelen, zodat de CSS-transitie iets heeft om vanaf te
  // animeren (scaleX(0) -> scaleX(1), vinkje pop-in).
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setRevealed(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (status === "concept") return null;

  const currentIndex = revealed ? STEP_ORDER[status] : -1;
  const isTerminalNegative = status === "verlopen" || status === "geweigerd";

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {STEPS.map((step, i) => {
        const isDone = i < currentIndex || (i === currentIndex && !isTerminalNegative);
        const isCurrent = i === currentIndex && !isTerminalNegative;
        return (
          <div key={step.status} className="flex flex-1 items-center gap-1.5 sm:gap-2">
            <div
              style={
                isDone
                  ? { borderColor: accentColor, backgroundColor: accentColor, boxShadow: `0 0 0 3px ${accentColor}26` }
                  : isCurrent
                    ? { borderColor: accentColor, color: accentColor }
                    : undefined
              }
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-semibold transition-all duration-300 ease-brand",
                isDone ? "text-white" : isCurrent ? "" : "border-ink-200 text-ink-300",
              )}
            >
              {isDone ? <Check className="size-3.5 kw-pop-in" /> : i + 1}
            </div>
            <span
              className={cn(
                "hidden text-xs font-medium transition-colors duration-300 ease-brand sm:inline",
                isDone || isCurrent ? "text-ink-500" : "text-ink-300",
              )}
            >
              {t(step.labelKey)}
            </span>
            {i < STEPS.length - 1 && (
              <div className="h-px flex-1 overflow-hidden bg-ink-200">
                <div
                  style={{
                    backgroundColor: accentColor,
                    transform: i < currentIndex ? "scaleX(1)" : "scaleX(0)",
                  }}
                  className="h-full w-full origin-left transition-transform duration-500 ease-brand"
                />
              </div>
            )}
          </div>
        );
      })}

      {isTerminalNegative && (
        <span
          className={cn(
            "ml-2 shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
            status === "verlopen" ? "bg-ink-100 text-ink-500" : "bg-red-50 text-red-700",
          )}
        >
          {status === "verlopen" ? t("status_verlopen") : t("status_geweigerd")}
        </span>
      )}
    </div>
  );
}
