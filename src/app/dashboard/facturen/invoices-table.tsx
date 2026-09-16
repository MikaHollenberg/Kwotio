"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Clock } from "lucide-react";
import { Badge, tones } from "@/components/ui/badge";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_TONES, INVOICE_TYPE_SHORT_LABELS, INVOICE_TYPE_TONES } from "@/lib/invoicing/status";
import { InvoiceRowActions } from "./invoice-row-actions";
import type { InvoiceStatus, InvoiceType } from "@/lib/types/database";

const STATUS_ORDER = Object.keys(INVOICE_STATUS_LABELS) as InvoiceStatus[];

export type InvoiceRow = {
  id: string;
  invoice_number: string;
  type: InvoiceType;
  status: InvoiceStatus;
  client_name: string;
  total_incl_vat: number;
  invoice_date: string;
  due_date: string;
  paid_at: string | null;
  /** Betaalde aanbetaling zonder al gekoppelde slotfactuur -- zie
   * `FacturenPage`. Voedt de "Wacht op slotfactuur"-snelfilter hieronder. */
  awaitingSlotfactuur: boolean;
};

/** `standaard` blijft ongelabeld (dat is de meerderheid, geen extra badge
 * nodig) -- aanbetaling/slotfactuur/creditnota moeten in één oogopslag
 * opvallen in de lijst. */
function InvoiceTypeBadge({ type }: { type: InvoiceType }) {
  if (type === "standaard") return null;
  return <Badge tone={INVOICE_TYPE_TONES[type]}>{INVOICE_TYPE_SHORT_LABELS[type]}</Badge>;
}

/** Zelfde tabel/kaart-opzet als `offertes-table.tsx`: tabel op desktop, een
 * kaartenlijst op mobiel, statusbadge en potlood/prullenbak-acties per rij.
 * Plus: zoeken op klantnaam/factuurnummer en een losse snelfilter voor
 * betaalde aanbetalingen die nog op een slotfactuur wachten (oudste
 * betaaldatum eerst, zodat een aanbetaling van maanden terug niet
 * wegzakt) -- deze snelfilter staat los van de statuschips, want "wacht op
 * slotfactuur" is geen factuurstatus maar een afgeleide actie-signalering. */
export function InvoicesTable({ invoices, canManage }: { invoices: InvoiceRow[]; canManage: boolean }) {
  const [search, setSearch] = useState("");
  const [activeStatuses, setActiveStatuses] = useState<Set<InvoiceStatus>>(new Set());
  const [awaitingOnly, setAwaitingOnly] = useState(false);

  const awaitingCount = useMemo(() => invoices.filter((i) => i.awaitingSlotfactuur).length, [invoices]);

  function toggleStatus(status: InvoiceStatus) {
    setAwaitingOnly(false);
    setActiveStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  }

  function toggleAwaitingOnly() {
    setActiveStatuses(new Set());
    setAwaitingOnly((v) => !v);
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    let rows = invoices.filter((i) => {
      if (query && !i.invoice_number.toLowerCase().includes(query) && !(i.client_name ?? "").toLowerCase().includes(query)) {
        return false;
      }
      return true;
    });
    if (awaitingOnly) {
      rows = rows.filter((i) => i.awaitingSlotfactuur);
      rows = [...rows].sort((a, b) => new Date(a.paid_at ?? 0).getTime() - new Date(b.paid_at ?? 0).getTime());
    } else if (activeStatuses.size > 0) {
      rows = rows.filter((i) => activeStatuses.has(i.status));
    }
    return rows;
  }, [invoices, search, activeStatuses, awaitingOnly]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-300" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek op klantnaam of factuurnummer…"
            className="h-10 w-64 rounded-brand-sm border border-ink-200 bg-white pl-9 pr-3 text-sm text-ink-500 outline-none transition-colors duration-200 ease-brand placeholder:text-ink-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_ORDER.map((status) => {
            const active = !awaitingOnly && activeStatuses.has(status);
            return (
              <button
                key={status}
                type="button"
                onClick={() => toggleStatus(status)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors duration-200 ease-brand",
                  active ? tones[INVOICE_STATUS_TONES[status]] : "border-ink-200 text-ink-400 hover:border-ink-300",
                )}
              >
                {INVOICE_STATUS_LABELS[status]}
              </button>
            );
          })}
          {awaitingCount > 0 && (
            <button
              type="button"
              onClick={toggleAwaitingOnly}
              className={cn(
                "flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors duration-200 ease-brand",
                awaitingOnly ? tones.orange : "border-ink-200 text-ink-400 hover:border-ink-300",
              )}
            >
              <Clock className="size-3.5" />
              Wacht op slotfactuur ({awaitingCount})
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-ink-400">
          {invoices.length === 0
            ? "Nog geen facturen. Maak er een aan vanuit een geaccepteerde offerte."
            : "Geen facturen gevonden voor deze zoekopdracht/filter."}
        </p>
      ) : (
        <>
          <div className="flex flex-col divide-y divide-ink-50 sm:hidden">
            {filtered.map((invoice) => (
              <div key={invoice.id} className="flex flex-col gap-2 py-3">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex flex-wrap items-center gap-2">
                    <Link href={`/dashboard/facturen/${invoice.id}`} className="font-medium text-ink-500 hover:text-teal-700">
                      {invoice.invoice_number}
                    </Link>
                    <InvoiceTypeBadge type={invoice.type} />
                  </span>
                  <Badge tone={INVOICE_STATUS_TONES[invoice.status]}>{INVOICE_STATUS_LABELS[invoice.status]}</Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-ink-400">
                  <span>{invoice.client_name || "—"}</span>
                  <span>
                    {awaitingOnly && invoice.paid_at
                      ? `Betaald op ${formatDate(invoice.paid_at)}`
                      : formatDate(invoice.invoice_date)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-ink-500">{formatCurrency(invoice.total_incl_vat)}</span>
                  {canManage && (
                    <InvoiceRowActions invoiceId={invoice.id} invoiceNumber={invoice.invoice_number} status={invoice.status} />
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs font-semibold uppercase tracking-wide text-ink-400">
                  <th className="px-5 py-3">Factuur</th>
                  <th className="px-5 py-3">Klant</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">{awaitingOnly ? "Betaaldatum" : "Factuurdatum"}</th>
                  <th className="px-5 py-3 text-right">Bedrag</th>
                  {canManage && <th className="px-5 py-3 text-right">Acties</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-ink-50 last:border-0 hover:bg-sand-100">
                    <td className="px-5 py-3">
                      <span className="flex flex-wrap items-center gap-2">
                        <Link href={`/dashboard/facturen/${invoice.id}`} className="font-medium text-ink-500 hover:text-teal-700">
                          {invoice.invoice_number}
                        </Link>
                        <InvoiceTypeBadge type={invoice.type} />
                      </span>
                    </td>
                    <td className="px-5 py-3 text-ink-400">{invoice.client_name || "—"}</td>
                    <td className="px-5 py-3">
                      <Badge tone={INVOICE_STATUS_TONES[invoice.status]}>{INVOICE_STATUS_LABELS[invoice.status]}</Badge>
                    </td>
                    <td className="px-5 py-3 text-ink-400">
                      {awaitingOnly && invoice.paid_at ? formatDate(invoice.paid_at) : formatDate(invoice.invoice_date)}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-ink-500">{formatCurrency(invoice.total_incl_vat)}</td>
                    {canManage && (
                      <td className="px-5 py-3 text-right">
                        <InvoiceRowActions invoiceId={invoice.id} invoiceNumber={invoice.invoice_number} status={invoice.status} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
