/** Eigen Suspense-boundary i.p.v. terug te vallen op de gedeelde
 * `/dashboard/loading.tsx` -- zie klanten/loading.tsx voor de reden. */
export default function ArrangementenLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="kw-skeleton h-3.5 w-24 rounded-full" />
          <div className="kw-skeleton h-7 w-44 rounded-brand-sm" />
        </div>
        <div className="kw-skeleton h-9 w-44 rounded-brand-sm" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="kw-skeleton h-40 w-full rounded-brand-lg" />
        ))}
      </div>
    </div>
  );
}
