/** Eigen Suspense-boundary i.p.v. terug te vallen op de gedeelde
 * `/dashboard/loading.tsx` -- zie klanten/loading.tsx voor de reden. */
export default function InstellingenLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="kw-skeleton h-3.5 w-24 rounded-full" />
        <div className="kw-skeleton h-7 w-44 rounded-brand-sm" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="kw-skeleton h-16 w-full rounded-brand-lg" />
        ))}
      </div>
    </div>
  );
}
