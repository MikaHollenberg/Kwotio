export function MiniBarChart({
  data,
  formatValue = (v) => String(v),
}: {
  data: { label: string; value: number }[];
  formatValue?: (value: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="flex h-32 items-end gap-3">
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex h-24 w-full items-end justify-center">
            <div
              className="w-full max-w-8 rounded-t-brand-sm bg-blue-400 transition-all duration-300 ease-brand"
              style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? 4 : 0 }}
              title={formatValue(d.value)}
            />
          </div>
          <span className="text-[11px] font-medium text-ink-400">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
