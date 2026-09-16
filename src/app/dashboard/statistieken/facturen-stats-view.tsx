import Link from "next/link";
import {
  Banknote,
  Hourglass,
  AlertTriangle,
  CalendarClock,
  Wallet,
  Trophy,
  Zap,
  FileStack,
  CreditCard,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { INVOICE_STATUS_LABELS, INVOICE_PAYMENT_METHOD_LABELS } from "@/lib/invoicing/status";
import type { InvoiceStats } from "@/lib/stats/invoice-queries";
import type { InvoiceStatus } from "@/lib/types/database";

const STATUS_BAR_COLOR: Record<InvoiceStatus, string> = {
  concept: "bg-ink-300",
  open: "bg-blue-500",
  deels_betaald: "bg-yellow-500",
  betaald: "bg-emerald-500",
  vervallen: "bg-red-500",
  geannuleerd: "bg-ink-200",
};

function Tile({
  label,
  icon: Icon,
  value,
  sub,
  accent,
  href,
}: {
  label: string;
  icon: typeof Banknote;
  value: string;
  sub?: string;
  accent: string;
  href?: string;
}) {
  const content = (
    <CardContent className="flex items-center gap-4">
      <div className={`flex size-11 shrink-0 items-center justify-center rounded-brand-sm ${accent}`}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-ink-400">{label}</p>
        <p className="truncate font-display text-xl font-semibold text-ink-500">{value}</p>
        {sub && <p className="text-xs text-ink-400">{sub}</p>}
      </div>
    </CardContent>
  );
  return href ? (
    <Link href={href}>
      <Card className="transition-colors duration-200 ease-brand hover:bg-sand-100">{content}</Card>
    </Link>
  ) : (
    <Card>{content}</Card>
  );
}

export function FacturenStatsView({ stats }: { stats: InvoiceStats }) {
  const statusOrder = Object.keys(INVOICE_STATUS_LABELS) as InvoiceStatus[];
  const maxStatusCount = Math.max(1, ...statusOrder.map((s) => stats.statusCounts[s]));
  const maxMonthlyRevenue = Math.max(1, ...stats.monthlyRevenue.map((m) => m.total));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Tile
          label="Ontvangen deze maand"
          icon={Banknote}
          value={formatCurrency(stats.kpi.receivedThisMonth)}
          accent="bg-emerald-50 text-emerald-600"
        />
        <Tile
          label="Openstaand"
          icon={Hourglass}
          value={formatCurrency(stats.kpi.outstandingAmount)}
          sub={`${stats.kpi.outstandingCount} factu${stats.kpi.outstandingCount === 1 ? "ur" : "ren"}`}
          accent="bg-blue-50 text-blue-600"
        />
        <Tile
          label="Te laat (vervallen)"
          icon={AlertTriangle}
          value={formatCurrency(stats.kpi.overdueAmount)}
          sub={`${stats.kpi.overdueCount} factu${stats.kpi.overdueCount === 1 ? "ur" : "ren"}`}
          accent="bg-red-50 text-red-600"
        />
        <Tile
          label="Gem. betaaltermijn"
          icon={CalendarClock}
          value={stats.kpi.avgPaymentDays != null ? `${stats.kpi.avgPaymentDays} dagen` : "—"}
          accent="bg-orange-50 text-orange-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Facturen per status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            {statusOrder.map((status) => {
              const count = stats.statusCounts[status];
              const percent = Math.round((count / maxStatusCount) * 100);
              return (
                <div key={status} className="flex items-center gap-3 text-sm">
                  <span className="w-28 shrink-0 truncate text-ink-500">{INVOICE_STATUS_LABELS[status]}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-sand-200">
                    <div className={`h-full rounded-full ${STATUS_BAR_COLOR[status]}`} style={{ width: `${percent}%` }} />
                  </div>
                  <span className="w-6 shrink-0 text-right text-ink-400">{count}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Omzet per maand</CardTitle>
              <CardDescription>Alleen betaalde facturen, op betaaldatum</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex h-28 items-end gap-3">
              {stats.monthlyRevenue.map((m) => {
                const heightPx = m.total > 0 ? Math.max(4, Math.round((m.total / maxMonthlyRevenue) * 112)) : 2;
                return (
                  <div
                    key={m.monthKey}
                    className="flex-1 rounded-t-sm bg-teal-500"
                    style={{ height: `${heightPx}px` }}
                    title={formatCurrency(m.total)}
                  />
                );
              })}
            </div>
            <div className="mt-1.5 flex gap-3">
              {stats.monthlyRevenue.map((m) => (
                <span key={m.monthKey} className="flex-1 text-center text-xs text-ink-400">
                  {m.label}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Btw-overzicht</CardTitle>
            <CardDescription>Handig bij de btw-aangifte — hoog/laag apart, op factuurdatum</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-ink-400">
                <th className="pb-2"></th>
                <th className="pb-2">Deze maand</th>
                <th className="pb-2">Dit kwartaal</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-ink-100">
                <td className="py-2 text-ink-500">Btw hoog</td>
                <td className="py-2 text-ink-500">{formatCurrency(stats.vat.month.high)}</td>
                <td className="py-2 text-ink-500">{formatCurrency(stats.vat.quarter.high)}</td>
              </tr>
              <tr className="border-t border-ink-100">
                <td className="py-2 text-ink-500">Btw laag</td>
                <td className="py-2 text-ink-500">{formatCurrency(stats.vat.month.low)}</td>
                <td className="py-2 text-ink-500">{formatCurrency(stats.vat.quarter.low)}</td>
              </tr>
              {(stats.vat.month.other !== 0 || stats.vat.quarter.other !== 0) && (
                <tr className="border-t border-ink-100">
                  <td className="py-2 text-ink-500">Btw overig/aangepast</td>
                  <td className="py-2 text-ink-500">{formatCurrency(stats.vat.month.other)}</td>
                  <td className="py-2 text-ink-500">{formatCurrency(stats.vat.quarter.other)}</td>
                </tr>
              )}
              <tr className="border-t border-ink-200 font-semibold">
                <td className="py-2 text-ink-500">Totaal af te dragen</td>
                <td className="py-2 text-ink-500">{formatCurrency(stats.vat.month.total)}</td>
                <td className="py-2 text-ink-500">{formatCurrency(stats.vat.quarter.total)}</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Tile
          label="Gem. factuurwaarde"
          icon={Wallet}
          value={formatCurrency(stats.funStats.avgInvoiceValue)}
          accent="bg-teal-50 text-teal-700"
        />
        <Tile
          label="Grootste factuur (mnd)"
          icon={Trophy}
          value={stats.funStats.largestInvoiceThisMonth ? formatCurrency(stats.funStats.largestInvoiceThisMonth.amount) : "—"}
          sub={stats.funStats.largestInvoiceThisMonth?.clientName}
          accent="bg-yellow-50 text-yellow-700"
        />
        <Tile
          label="Snelste betaling"
          icon={Zap}
          value={stats.funStats.fastestPaymentDays != null ? `${stats.funStats.fastestPaymentDays} dagen` : "—"}
          accent="bg-blue-50 text-blue-600"
        />
        <Tile
          label="Wacht op slotfactuur"
          icon={FileStack}
          value={String(stats.funStats.awaitingSlotfactuurCount)}
          sub={stats.funStats.awaitingSlotfactuurCount > 0 ? "Bekijk in facturenlijst" : undefined}
          accent="bg-orange-50 text-orange-600"
          href={stats.funStats.awaitingSlotfactuurCount > 0 ? "/dashboard/facturen" : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="size-4 text-teal-600" />
              <CardTitle>Betaalmethodes</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            {stats.paymentMethods.length === 0 ? (
              <p className="text-sm text-ink-400">Nog geen betaalde facturen.</p>
            ) : (
              stats.paymentMethods.map((m) => (
                <div key={m.method} className="flex items-center gap-3 text-sm">
                  <span className="w-24 shrink-0 truncate text-ink-500">{INVOICE_PAYMENT_METHOD_LABELS[m.method]}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-sand-200">
                    <div className="h-full rounded-full bg-teal-500" style={{ width: `${m.percent}%` }} />
                  </div>
                  <span className="w-16 shrink-0 text-right text-ink-400">
                    {m.count}× ({m.percent}%)
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="size-4 text-teal-600" />
              <CardTitle>Top klanten (omzet dit jaar)</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {stats.topClients.length === 0 ? (
              <p className="text-sm text-ink-400">Nog geen betaalde facturen dit jaar.</p>
            ) : (
              <div className="flex flex-col gap-2 text-sm">
                {stats.topClients.map((c, i) => (
                  <div key={`${c.name}-${i}`} className="flex items-center justify-between gap-3">
                    <span className="truncate text-ink-500">
                      {i + 1}. {c.name}
                    </span>
                    <span className="shrink-0 font-medium text-ink-500">{formatCurrency(c.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
