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

export function StatusBar({ status }: { status: QuoteStatus }) {
  const { t } = useTranslation();
  if (status === "concept") return null;

  const currentIndex = STEP_ORDER[status];
  const isTerminalNegative = status === "verlopen" || status === "geweigerd";

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {STEPS.map((step, i) => {
        const isDone = i < currentIndex || (i === currentIndex && !isTerminalNegative);
        const isCurrent = i === currentIndex && !isTerminalNegative;
        return (
          <div key={step.status} className="flex flex-1 items-center gap-1.5 sm:gap-2">
            <div
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-semibold transition-colors duration-200 ease-brand",
                isDone
                  ? "border-teal-500 bg-teal-500 text-white"
                  : isCurrent
                    ? "border-teal-500 text-teal-600"
                    : "border-ink-200 text-ink-300",
              )}
            >
              {isDone ? <Check className="size-3.5" /> : i + 1}
            </div>
            <span
              className={cn(
                "hidden text-xs font-medium sm:inline",
                isDone || isCurrent ? "text-ink-500" : "text-ink-300",
              )}
            >
              {t(step.labelKey)}
            </span>
            {i < STEPS.length - 1 && (
              <div className={cn("h-px flex-1", i < currentIndex ? "bg-teal-500" : "bg-ink-200")} />
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
