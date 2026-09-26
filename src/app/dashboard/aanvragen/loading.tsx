import { Card } from "@/components/ui/card";

/** Eigen Suspense-boundary i.p.v. terug te vallen op de gedeelde
 * `/dashboard/loading.tsx` -- zie klanten/loading.tsx voor de reden. */
export default function AanvragenLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="kw-skeleton h-3.5 w-24 rounded-full" />
        <div className="kw-skeleton h-7 w-48 rounded-brand-sm" />
      </div>
      <div className="kw-skeleton h-10 w-full max-w-sm rounded-brand-sm" />
      <Card className="flex flex-col gap-3 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="kw-skeleton h-16 w-full rounded-brand-sm" />
        ))}
      </Card>
    </div>
  );
}
