import { Card, CardContent } from "@/components/ui/card";

/** Skeleton i.p.v. een kale spinner terwijl de dashboarddata binnenkomt
 * (Kwotio Motion Concepts #14) -- Next.js' automatische Suspense-fallback
 * per routesegment, verschijnt alleen bij een trage server-response. */
export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="kw-skeleton h-3.5 w-24 rounded-full" />
          <div className="kw-skeleton h-7 w-56 rounded-brand-sm" />
        </div>
        <div className="kw-skeleton h-11 w-36 rounded-brand-sm" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-4">
              <div className="kw-skeleton size-11 shrink-0 rounded-brand-sm" />
              <div className="flex flex-1 flex-col gap-2">
                <div className="kw-skeleton h-3 w-20 rounded-full" />
                <div className="kw-skeleton h-5 w-14 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="flex flex-col gap-3">
            <div className="kw-skeleton h-4 w-40 rounded-full" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="kw-skeleton h-10 w-full rounded-brand-sm" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-3">
            <div className="kw-skeleton h-4 w-48 rounded-full" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="kw-skeleton h-14 w-full rounded-brand-sm" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
