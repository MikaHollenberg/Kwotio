import { Card, CardContent } from "@/components/ui/card";

/** Eigen Suspense-boundary i.p.v. terug te vallen op de gedeelde
 * `/dashboard/loading.tsx` -- zie klanten/loading.tsx voor de reden. */
export default function StatistiekenLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="kw-skeleton h-3.5 w-24 rounded-full" />
        <div className="kw-skeleton h-7 w-40 rounded-brand-sm" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex flex-col gap-2">
              <div className="kw-skeleton h-3 w-20 rounded-full" />
              <div className="kw-skeleton h-6 w-16 rounded-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="flex flex-col gap-3">
          <div className="kw-skeleton h-4 w-40 rounded-full" />
          <div className="kw-skeleton h-40 w-full rounded-brand-sm" />
        </CardContent>
      </Card>
    </div>
  );
}
