import Link from "next/link";
import { Building2, Users, FileText, Euro } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MiniBarChart } from "@/components/admin/mini-bar-chart";
import { getPlatformStats } from "@/lib/admin/queries";
import { formatCurrency } from "@/lib/utils";

export default async function AdminStatsPage() {
  const stats = await getPlatformStats();

  const kpiCards = [
    {
      label: "Organisaties",
      icon: Building2,
      value: String(stats.organizationsTotal),
      sub: `${stats.organizationsByStatus.actief} actief · ${stats.organizationsByStatus.proefperiode} proef · ${stats.organizationsByStatus.opgezegd} opgezegd`,
    },
    { label: "Gebruikers totaal", icon: Users, value: String(stats.usersTotal), sub: "over alle organisaties" },
    {
      label: "Offertes totaal",
      icon: FileText,
      value: String(stats.quotesTotal),
      sub: `${stats.quotesLast30Days} in de laatste 30 dagen`,
    },
    {
      label: "MRR",
      icon: Euro,
      value: formatCurrency(stats.mrr),
      sub: `${formatCurrency(stats.estimatedRevenueToDate)} omzet tot nu toe (schatting)`,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-ink-400">Hoofdaccount</p>
        <h2 className="font-display text-2xl font-semibold text-ink-500">Statistieken</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map(({ label, icon: Icon, value, sub }) => (
          <Card key={label}>
            <CardContent className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-brand-sm bg-blue-50 text-blue-600">
                <Icon className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-ink-400">{label}</p>
                <p className="font-display text-xl font-semibold text-ink-500">{value}</p>
                <p className="truncate text-[11px] text-ink-400">{sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Klanten per maand</CardTitle>
          </CardHeader>
          <CardContent>
            <MiniBarChart data={stats.organizationsPerMonth.map((d) => ({ label: d.month, value: d.count }))} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Offertes per maand</CardTitle>
          </CardHeader>
          <CardContent>
            <MiniBarChart data={stats.quotesPerMonth.map((d) => ({ label: d.month, value: d.count }))} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Omzet per maand</CardTitle>
              <CardDescription>Schatting o.b.v. maandbedrag × looptijd</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <MiniBarChart
              data={stats.revenuePerMonth.map((d) => ({ label: d.month, value: d.total }))}
              formatValue={(v) => formatCurrency(v)}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top-organisaties</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.topOrganizations.length === 0 ? (
            <p className="text-sm text-ink-400">Nog geen offertes over alle organisaties.</p>
          ) : (
            <div className="flex flex-col divide-y divide-ink-100">
              {stats.topOrganizations.map((org) => (
                <Link
                  key={org.id}
                  href={`/admin/organisaties/${org.id}`}
                  className="flex items-center justify-between gap-4 py-3 hover:bg-sand-100"
                >
                  <p className="text-sm font-medium text-ink-500">{org.name}</p>
                  <div className="flex shrink-0 items-center gap-6 text-sm">
                    <span className="text-ink-400">{org.quoteCount} offertes</span>
                    <span className="font-semibold text-ink-500">{formatCurrency(org.revenue)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
