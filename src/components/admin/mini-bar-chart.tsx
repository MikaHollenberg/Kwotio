export function MiniBarChart({
  data,
  formatValue = (v) => String(v),
}: {
  data: { label: string; value: number }[];
  formatValue?: (value: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="flex h-36 items-end gap-3">
      {data.map((d) => (
        <div key={d.label} className="group flex flex-1 flex-col items-center gap-2">
          <div className="flex h-28 w-full flex-col items-center justify-end">
            <span className="mb-1 text-[11px] font-semibold text-ink-400 opacity-0 transition-opacity duration-200 ease-brand group-hover:opacity-100">
              {formatValue(d.value)}
            </span>
            <div
              className="w-full max-w-8 rounded-t-brand-sm bg-gold-300 transition-all duration-300 ease-brand group-hover:bg-gold-500"
              style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? 4 : 0 }}
            />
          </div>
          <span className="text-[11px] font-medium text-ink-400">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
