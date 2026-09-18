import type { ReactNode } from "react";
import { FileText, TrendingUp, Clock, Trophy, Circle, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import {
  getDashboardKpis,
  getNextBestActions,
  getOnboardingSteps,
  getPopularPackageThisMonth,
  getRecentActivity,
  getUpcomingEvents,
} from "@/lib/stats/queries";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { EventsCalendar } from "@/components/dashboard/events-calendar";
import { CountUpValue } from "@/components/dashboard/count-up-value";
import { formatDate, cn } from "@/lib/utils";

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

  const [kpis, popularPackage, recentActivity, upcomingEvents, onboardingSteps, nextBestActions] = await Promise.all([
    getDashboardKpis(supabase, organizationId),
    getPopularPackageThisMonth(supabase, organizationId),
    getRecentActivity(supabase, organizationId),
    getUpcomingEvents(supabase, organizationId),
    getOnboardingSteps(supabase, organizationId),
    getNextBestActions(supabase, organizationId),
  ]);
  const onboardingComplete = onboardingSteps.every((s) => s.done);

  const kpiCards: { label: string; icon: typeof FileText; value: ReactNode }[] = [
    {
      label: "Offertes deze maand",
      icon: FileText,
      value: <CountUpValue value={kpis.quotesThisMonth} format="int" />,
    },
    {
      label: "Conversieratio",
      icon: TrendingUp,
      value:
        kpis.conversionRate === null ? (
          "—"
        ) : (
          <CountUpValue value={kpis.conversionRate * 100} format="percent" />
        ),
    },
    {
      label: "Gem. doorlooptijd",
      icon: Clock,
      value:
        kpis.avgDaysToAccept === null ? (
          "—"
        ) : (
          <CountUpValue value={kpis.avgDaysToAccept} format="decimal1" />
        ),
    },
    {
      label: "Populairste pakket deze maand",
      icon: Trophy,
      value: popularPackage ? `${popularPackage.name} (${popularPackage.count}×)` : "Nog geen keuzes deze maand",
    },
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

      {nextBestActions.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-orange-600" />
              <CardTitle>Volgende beste actie</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-orange-100">
            {nextBestActions.map((action) => (
              <Link
                key={action.id}
                href={action.href}
                className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0 hover:opacity-80"
              >
                <span className="flex items-center gap-2 text-sm text-ink-500">
                  {action.urgency === "high" && <span className="size-1.5 shrink-0 rounded-full bg-red-500" />}
                  {action.message}
                </span>
                <ArrowRight className="size-4 shrink-0 text-ink-400" />
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {!onboardingComplete && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle>Aan de slag met Kwotio</CardTitle>
              <span className="text-xs font-semibold text-ink-400">
                {onboardingSteps.filter((s) => s.done).length}/{onboardingSteps.length} stappen klaar
              </span>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {onboardingSteps.map((step) => (
              <Link
                key={step.id}
                href={step.href}
                className="flex items-start gap-3 rounded-brand-sm px-2 py-2 hover:bg-sand-100"
              >
                {step.done ? (
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-teal-600" />
                ) : (
                  <Circle className="mt-0.5 size-5 shrink-0 text-ink-300" />
                )}
                <span className="flex flex-col">
                  <span className={cn("text-sm font-medium", step.done ? "text-ink-400 line-through" : "text-ink-500")}>
                    {step.label}
                  </span>
                  <span className="text-xs text-ink-400">{step.description}</span>
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

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
