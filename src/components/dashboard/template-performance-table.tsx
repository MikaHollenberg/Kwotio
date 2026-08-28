import type { TemplatePerformance } from "@/lib/stats/queries";

export function TemplatePerformanceTable({ templates }: { templates: TemplatePerformance[] }) {
  if (templates.length === 0) {
    return <p className="text-sm text-ink-400">Nog geen offertes vanuit een template gestart.</p>;
  }

  return (
    <>
      <div className="flex flex-col divide-y divide-ink-50 sm:hidden">
        {templates.map((t) => (
          <div key={t.templateId} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
            <span className="font-medium text-ink-500">{t.name}</span>
            <div className="flex items-center justify-between text-xs text-ink-400">
              <span>
                {t.requestedCount} aangevraagd · {t.acceptedCount} verkocht
              </span>
              <span className="font-semibold text-ink-500">{Math.round(t.conversionRate * 100)}%</span>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-xs font-semibold uppercase tracking-wide text-ink-400">
              <th className="py-2 pr-4">Template</th>
              <th className="px-2 py-2 text-right">Aangevraagd</th>
              <th className="px-2 py-2 text-right">Verkocht</th>
              <th className="py-2 pl-4 text-right">Conversie</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((t) => (
              <tr key={t.templateId} className="border-b border-ink-50 last:border-0">
                <td className="py-2 pr-4 text-ink-500">{t.name}</td>
                <td className="px-2 py-2 text-right text-ink-400">{t.requestedCount}</td>
                <td className="px-2 py-2 text-right text-ink-400">{t.acceptedCount}</td>
                <td className="py-2 pl-4 text-right font-semibold text-ink-500">
                  {Math.round(t.conversionRate * 100)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
