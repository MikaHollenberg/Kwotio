import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";
import type { QuoteStatus } from "@/lib/types/database";

export const tones = {
  neutral: "bg-ink-50 text-ink-500 border-ink-200",
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  teal: "bg-teal-50 text-teal-700 border-teal-200",
  orange: "bg-orange-50 text-orange-700 border-orange-200",
  yellow: "bg-yellow-50 text-yellow-800 border-yellow-200",
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  red: "bg-red-50 text-red-700 border-red-200",
};

export function Badge({
  className,
  tone = "neutral",
  ...props
}: { tone?: keyof typeof tones } & ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

export const STATUS_LABELS: Record<QuoteStatus, string> = {
  concept: "Concept",
  verzonden: "Verzonden",
  bekeken: "Bekeken",
  in_overleg: "In overleg",
  geaccepteerd: "Geaccepteerd",
  verlopen: "Verlopen",
  geweigerd: "Geweigerd",
};

export const STATUS_TONES: Record<QuoteStatus, keyof typeof tones> = {
  concept: "neutral",
  verzonden: "blue",
  bekeken: "teal",
  in_overleg: "yellow",
  geaccepteerd: "green",
  verlopen: "red",
  geweigerd: "red",
};

export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  return <Badge tone={STATUS_TONES[status]}>{STATUS_LABELS[status]}</Badge>;
}
