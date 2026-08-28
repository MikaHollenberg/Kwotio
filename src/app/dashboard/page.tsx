import { FileText, TrendingUp, Clock, Euro } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getDashboardKpis, getRecentActivity, getUpcomingEvents } from "@/lib/stats/queries";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { EventsCalendar } from "@/components/dashboard/events-calendar";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function DashboardOverviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user!.id)
    .single();
  const organizationId = profile!.organization_id;

  const [kpis, recentActivity, upcomingEvents] = await Promise.all([
    getDashboardKpis(supabase, organizationId),
    getRecentActivity(supabase, organizationId),
    getUpcomingEvents(supabase, organizationId),
  ]);

  const kpiCards = [
    { label: "Offertes deze maand", icon: FileText, value: String(kpis.quotesThisMonth) },
    {
      label: "Conversieratio",
      icon: TrendingUp,
      value: kpis.conversionRate === null ? "—" : `${Math.round(kpis.conversionRate * 100)}%`,
    },
    {
      label: "Gem. doorlooptijd",
      icon: Clock,
      value: kpis.avgDaysToAccept === null ? "—" : `${kpis.avgDaysToAccept.toFixed(1)}d`,
    },
    { label: "Pipeline-waarde", icon: Euro, value: formatCurrency(kpis.pipelineValue) },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-ink-400">Welkom terug</p>
          <h2 className="font-display text-2xl font-semibold text-ink-500">
            Zo staat het ervoor
          </h2>
        </div>
        <ButtonLink href="/dashboard/offertes/nieuw" variant="primary">
          Nieuwe offerte
        </ButtonLink>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map(({ label, icon: Icon, value }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-brand-sm bg-blue-50 text-blue-600">
                <Icon className="size-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-ink-400">{label}</p>
                <p className="font-display text-xl font-semibold text-ink-500">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1.4fr]">
        <Card>
          <CardHeader>
            <CardTitle>Aankomende events</CardTitle>
          </CardHeader>
          <CardContent>
            <EventsCalendar events={upcomingEvents} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Geaccepteerd, binnenkort</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-ink-400">Nog geen geaccepteerde offertes met een eventdatum.</p>
            ) : (
              <div className="flex flex-col divide-y divide-ink-100">
                {upcomingEvents.map((e) => (
                  <a
                    key={e.quoteId}
                    href={`/dashboard/offertes/${e.quoteId}`}
                    className="flex items-center justify-between gap-4 py-3 hover:bg-sand-100"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink-500">{e.title}</p>
                      <p className="text-xs text-ink-400">{e.clientName ?? "Geen klant"}</p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-teal-600">{formatDate(e.eventDate)}</span>
                  </a>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recente activiteit</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityFeed items={recentActivity} />
        </CardContent>
      </Card>

      {kpis.topTemplates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Best converterende templates</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {kpis.topTemplates.map((t) => (
              <div key={t.templateId} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-ink-500">{t.name}</p>
                  <p className="text-xs text-ink-400">
                    {t.acceptedCount} van {t.sentCount} verstuurde offertes geaccepteerd
                  </p>
                </div>
                <div className="flex w-32 items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-sand-200">
                    <div
                      className="h-full rounded-full bg-teal-500"
                      style={{ width: `${Math.round(t.rate * 100)}%` }}
                    />
                  </div>
                  <span className="w-9 shrink-0 text-right text-xs font-semibold text-ink-500">
                    {Math.round(t.rate * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
