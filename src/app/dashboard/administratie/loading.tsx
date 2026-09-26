import { Card, CardContent } from "@/components/ui/card";

/** Eigen Suspense-boundary i.p.v. terug te vallen op de gedeelde
 * `/dashboard/loading.tsx` -- zie klanten/loading.tsx voor de reden. */
export default function AdministratieLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="kw-skeleton h-3.5 w-24 rounded-full" />
          <div className="kw-skeleton h-7 w-44 rounded-brand-sm" />
        </div>
        <div className="kw-skeleton h-9 w-48 rounded-brand-sm" />
      </div>
      <Card>
        <CardContent className="flex flex-col gap-3">
          <div className="kw-skeleton h-4 w-32 rounded-full" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="kw-skeleton h-10 w-full rounded-brand-sm" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
