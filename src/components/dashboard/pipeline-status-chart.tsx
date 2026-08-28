import type { QuoteStatus } from "@/lib/types/database";
import type { PipelineQuote } from "@/lib/stats/queries";
import { STATUS_LABELS } from "@/components/ui/badge";

const COLUMN_ORDER: QuoteStatus[] = [
  "concept",
  "verzonden",
  "bekeken",
  "in_overleg",
  "geaccepteerd",
  "verlopen",
  "geweigerd",
];

const BAR_CLASS: Record<QuoteStatus, string> = {
  concept: "bg-ink-300",
  verzonden: "bg-blue-500",
  bekeken: "bg-teal-500",
  in_overleg: "bg-yellow-500",
  geaccepteerd: "bg-emerald-500",
  verlopen: "bg-red-400",
  geweigerd: "bg-red-500",
};

export function PipelineStatusChart({ pipeline }: { pipeline: Record<QuoteStatus, PipelineQuote[]> }) {
  const counts = COLUMN_ORDER.map((status) => ({ status, count: pipeline[status].length }));
  const max = Math.max(1, ...counts.map((c) => c.count));

  return (
    <div className="flex h-52 items-end gap-4">
      {counts.map(({ status, count }) => (
        <div key={status} className="flex flex-1 flex-col items-center gap-2">
          <span className="text-xs font-semibold text-ink-500">{count}</span>
          <div className="flex h-36 w-full items-end justify-center">
            <div
              className={`w-full max-w-10 rounded-t-brand-sm transition-all duration-300 ease-brand ${BAR_CLASS[status]}`}
              style={{ height: `${(count / max) * 100}%`, minHeight: count > 0 ? 6 : 0 }}
            />
          </div>
          <span className="text-center text-[11px] font-medium text-ink-400">{STATUS_LABELS[status]}</span>
        </div>
      ))}
    </div>
  );
}
