import { FileDown, TrendingUp, TrendingDown, Clock3, Users, Trophy, CalendarDays } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  getPipeline,
  getMonthlySeries,
  getTemplatePerformance,
  getExpectedGuestsThisMonth,
  getPopularPackageThisMonth,
  getBusiestDayThisMonth,
} from "@/lib/stats/queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PipelineStatusChart } from "@/components/dashboard/pipeline-status-chart";
import { GrowthComparison } from "@/components/dashboard/growth-comparison";
import { TemplatePerformanceTable } from "@/components/dashboard/template-performance-table";
import { ExportCsvButton } from "@/components/dashboard/export-csv-button";
import { ButtonLink } from "@/components/ui/button";
import { STATUS_LABELS } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function StatistiekenPage() {
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

  const [pipeline, monthlySeries, templatePerformance, expectedGuests, popularPackage, busiestDay] = await Promise.all([
    getPipeline(supabase, organizationId),
    getMonthlySeries(supabase, organizationId),
    getTemplatePerformance(supabase, organizationId),
    getExpectedGuestsThisMonth(supabase, organizationId),
    getPopularPackageThisMonth(supabase, organizationId),
    getBusiestDayThisMonth(supabase, organizationId),
  ]);

  const busiestDayLabel = busiestDay
    ? new Date(busiestDay.date).toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" })
    : null;

  const funStats = [
    {
      label: "Verwachte gasten deze maand",
      icon: Users,
      value: expectedGuests > 0 ? String(expectedGuests) : "—",
      accent: "bg-blue-50 text-blue-600",
    },
    {
      label: "Populairste pakket deze maand",
      icon: Trophy,
      value: popularPackage ? `${popularPackage.name} (${popularPackage.count}×)` : "Nog geen keuzes",
      accent: "bg-yellow-50 text-yellow-700",
    },
    {
      label: "Drukste dag deze maand",
      icon: CalendarDays,
      value: busiestDay ? `${busiestDayLabel} (${busiestDay.count} events)` : "Nog geen events",
      accent: "bg-emerald-50 text-emerald-600",
    },
  ];

  const exportRows = Object.entries(pipeline).flatMap(([status, quotes]) =>
    quotes.map((q) => ({
      Titel: q.title,
      Klant: q.clientName ?? "",
      Status: STATUS_LABELS[status as keyof typeof pipeline],
      Bedrag: q.total,
      Valuta: q.currency,
      "Laatst gewijzigd": formatDate(q.updatedAt),
    })),
  );

  const wonRevenue = pipeline.geaccepteerd.reduce((sum, q) => sum + q.total, 0);
  const lostDeclinedRevenue = pipeline.geweigerd.reduce((sum, q) => sum + q.total, 0);
  const lostExpiredRevenue = pipeline.verlopen.reduce((sum, q) => sum + q.total, 0);

  const revenueTiles = [
    { label: "Omzet geaccepteerd", icon: TrendingUp, value: formatCurrency(wonRevenue), accent: "bg-emerald-50 text-emerald-600" },
    { label: "Omzet gemist (geweigerd)", icon: TrendingDown, value: formatCurrency(lostDeclinedRevenue), accent: "bg-red-50 text-red-600" },
    { label: "Omzet gemist (verlopen)", icon: Clock3, value: formatCurrency(lostExpiredRevenue), accent: "bg-sand-200 text-ink-400" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-ink-400">Overzicht per status en omzet</p>
          <h2 className="font-display text-2xl font-semibold text-ink-500">Statistieken</h2>
        </div>
        <div className="flex items-center gap-2">
          <ExportCsvButton rows={exportRows} filename="offertes-pipeline.csv" />
          <ButtonLink href="/api/reports/pipeline" variant="outline" size="sm">
            <FileDown className="size-4" /> Exporteer PDF
          </ButtonLink>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {revenueTiles.map(({ label, icon: Icon, value, accent }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4">
              <div className={`flex size-11 shrink-0 items-center justify-center rounded-brand-sm ${accent}`}>
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

      <Card>
        <CardHeader>
          <CardTitle>Offertes per status</CardTitle>
        </CardHeader>
        <CardContent>
          <PipelineStatusChart pipeline={pipeline} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Vergelijk periodes</CardTitle>
            <CardDescription>Hoeveel offertes zijn erbij gekomen tussen twee periodes</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <GrowthComparison series={monthlySeries} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {funStats.map(({ label, icon: Icon, value, accent }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4">
              <div className={`flex size-11 shrink-0 items-center justify-center rounded-brand-sm ${accent}`}>
                <Icon className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-ink-400">{label}</p>
                <p className="truncate font-display text-xl font-semibold text-ink-500">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Templates: populariteit &amp; conversie</CardTitle>
            <CardDescription>Alleen offertes gestart vanuit een template, niet losse/custom offertes</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <TemplatePerformanceTable templates={templatePerformance} />
        </CardContent>
      </Card>
    </div>
  );
}
