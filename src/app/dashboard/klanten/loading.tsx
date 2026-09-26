import { Card } from "@/components/ui/card";

/** Eigen Suspense-boundary voor deze pagina i.p.v. terug te vallen op de
 * gedeelde `/dashboard/loading.tsx` -- zonder deze zou een navigatie
 * hierheen (bv. vanuit de rondleiding) bubbelen naar die bovenliggende
 * boundary, wat een onnodig grote/inconsistente skeleton-flash gaf. */
export default function KlantenLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="kw-skeleton h-3.5 w-20 rounded-full" />
          <div className="kw-skeleton h-7 w-32 rounded-brand-sm" />
        </div>
        <div className="flex gap-2">
          <div className="kw-skeleton h-9 w-40 rounded-brand-sm" />
          <div className="kw-skeleton h-9 w-32 rounded-brand-sm" />
        </div>
      </div>
      <Card className="flex flex-col gap-3 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="kw-skeleton h-12 w-full rounded-brand-sm" />
        ))}
      </Card>
    </div>
  );
}
