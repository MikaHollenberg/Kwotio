"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, FileText, Search, ChevronUp, ChevronDown, Trash2, X } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { QuoteStatusBadge, STATUS_LABELS, STATUS_TONES, tones } from "@/components/ui/badge";
import { ExportCsvButton } from "@/components/dashboard/export-csv-button";
import { OfferteRowActions } from "./offerte-row-actions";
import { OfferteEditLink } from "./offerte-edit-link";
import { deleteQuotes } from "./actions";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { calculateActualQuoteValue } from "@/lib/blocks/pricing";
import type { QuoteStatus } from "@/lib/types/database";

const STATUS_ORDER = Object.keys(STATUS_LABELS) as QuoteStatus[];

type QuoteRow = {
  id: string;
  title: string;
  status: QuoteStatus;
  total: number;
  currency: string;
  created_at: string;
  updated_at: string;
  event_date: string | null;
  client_id: string | null;
  price_per_person: boolean;
  aantal_personen: number | null;
  share_token: string;
  decline_reason: string | null;
  clientName: string | null;
};

type SortColumn = "created_at" | "updated_at";

function QuoteValueCell({
  total,
  currency,
  pricePerPerson,
  aantalPersonen,
  align = "left",
}: {
  total: number;
  currency: string;
  pricePerPerson: boolean;
  aantalPersonen: number | null;
  align?: "left" | "right";
}) {
  const knowsHeadcount = pricePerPerson && aantalPersonen != null;

  if (!knowsHeadcount) {
    return (
      <span className="font-medium text-ink-500">
        {formatCurrency(total, currency)}
        {pricePerPerson ? " p.p." : ""}
      </span>
    );
  }

  const actualValue = calculateActualQuoteValue({ total, pricePerPerson, aantalPersonen });
  return (
    <div className={cn("flex flex-col", align === "right" && "items-end")}>
      <span className="font-medium text-ink-500">{formatCurrency(actualValue, currency)}</span>
      <span className="text-xs text-ink-400">{formatCurrency(total, currency)} p.p.</span>
    </div>
  );
}

function SortableHeader({
  label,
  column,
  activeColumn,
  direction,
  onSort,
}: {
  label: string;
  column: SortColumn;
  activeColumn: SortColumn;
  direction: "asc" | "desc";
  onSort: (column: SortColumn) => void;
}) {
  const active = activeColumn === column;
  return (
    <th className="px-5 py-3 text-right">
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn(
          "inline-flex items-center gap-1 hover:text-ink-500",
          active && "text-ink-500",
        )}
      >
        {label}
        {active &&
          (direction === "desc" ? <ChevronDown className="size-3.5" /> : <ChevronUp className="size-3.5" />)}
      </button>
    </th>
  );
}

export function OffertesTable({ quotes }: { quotes: QuoteRow[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Set<QuoteStatus>>(new Set());
  const [sortColumn, setSortColumn] = useState<SortColumn>("updated_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeletePending, startBulkDeleteTransition] = useTransition();

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleBulkDelete() {
    startBulkDeleteTransition(async () => {
      await deleteQuotes([...selectedIds]);
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
    });
  }

  function toggleStatus(status: QuoteStatus) {
    setStatusFilter((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  }

  function toggleSort(column: SortColumn) {
    if (sortColumn === column) {
      setSortDirection((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  }

  const visibleQuotes = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = quotes.filter((q) => {
      if (statusFilter.size > 0 && !statusFilter.has(q.status)) return false;
      if (query && !(q.clientName ?? "").toLowerCase().includes(query)) return false;
      return true;
    });
    return [...filtered].sort((a, b) => {
      const diff = new Date(a[sortColumn]).getTime() - new Date(b[sortColumn]).getTime();
      return sortDirection === "desc" ? -diff : diff;
    });
  }, [quotes, search, statusFilter, sortColumn, sortDirection]);

  function toCsvRow(q: QuoteRow) {
    return {
      Titel: q.title,
      Klant: q.clientName ?? "",
      Status: STATUS_LABELS[q.status],
      Eventdatum: q.event_date ? formatDate(q.event_date) : "",
      Bedrag: calculateActualQuoteValue({
        total: Number(q.total),
        pricePerPerson: q.price_per_person,
        aantalPersonen: q.aantal_personen,
      }),
      "Prijs p.p.": q.price_per_person ? Number(q.total) : "",
      Valuta: q.currency,
      Aangemaakt: formatDate(q.created_at),
      "Laatst gewijzigd": formatDate(q.updated_at),
    };
  }

  const exportRows = visibleQuotes.map(toCsvRow);
  const selectedQuotes = visibleQuotes.filter((q) => selectedIds.has(q.id));
  const allVisibleSelected = visibleQuotes.length > 0 && visibleQuotes.every((q) => selectedIds.has(q.id));

  function toggleSelectAllVisible() {
    setSelectedIds((prev) => {
      if (allVisibleSelected) {
        const next = new Set(prev);
        visibleQuotes.forEach((q) => next.delete(q.id));
        return next;
      }
      return new Set([...prev, ...visibleQuotes.map((q) => q.id)]);
    });
  }

  if (quotes.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-ink-400">Alle offertes</p>
            <h2 className="font-display text-2xl font-semibold text-ink-500">Offertes</h2>
          </div>
          <ButtonLink href="/dashboard/offertes/nieuw" data-faq-id="new-quote-button">
            <Plus className="size-4" /> Nieuwe offerte
          </ButtonLink>
        </div>
        <Card className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <FileText className="kw-bob size-8 text-ink-300" />
          <p className="text-sm text-ink-400">
            Nog geen offertes. Maak je eerste offerte aan vanuit een template of vanaf nul.
          </p>
          <ButtonLink href="/dashboard/offertes/nieuw" size="sm" className="mt-1">
            <Plus className="size-4" /> Eerste offerte maken
          </ButtonLink>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-ink-400">Alle offertes</p>
          <h2 className="font-display text-2xl font-semibold text-ink-500">Offertes</h2>
        </div>
        <div className="flex items-center gap-2">
          <ExportCsvButton rows={exportRows} filename="offertes.csv" />
          <ButtonLink href="/dashboard/offertes/nieuw" data-faq-id="new-quote-button">
            <Plus className="size-4" /> Nieuwe offerte
          </ButtonLink>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-300" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek op klantnaam…"
            className="h-10 w-56 rounded-brand-sm border border-ink-200 bg-white pl-9 pr-3 text-sm text-ink-500 outline-none transition-colors duration-200 ease-brand placeholder:text-ink-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_ORDER.map((status) => {
            const active = statusFilter.has(status);
            return (
              <button
                key={status}
                type="button"
                onClick={() => toggleStatus(status)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors duration-200 ease-brand",
                  active ? tones[STATUS_TONES[status]] : "border-ink-200 text-ink-400 hover:border-ink-300 hover:text-ink-500",
                )}
              >
                {STATUS_LABELS[status]}
              </button>
            );
          })}
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-brand-sm border border-teal-200 bg-teal-50 px-4 py-2.5">
          <p className="text-sm font-medium text-teal-800">{selectedIds.size} geselecteerd</p>
          <div className="ml-auto flex items-center gap-2">
            <ExportCsvButton rows={selectedQuotes.map(toCsvRow)} filename="offertes-selectie.csv" label="Exporteer selectie" />
            <Button variant="outline" size="sm" onClick={() => setBulkDeleteOpen(true)} className="text-red-600 hover:bg-red-50">
              <Trash2 className="size-4" /> Verwijderen
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())} title="Selectie wissen">
              <X className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {visibleQuotes.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <FileText className="size-8 text-ink-300" />
          <p className="text-sm text-ink-400">Geen offertes gevonden voor deze zoekopdracht/filter.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="flex flex-col divide-y divide-ink-50 sm:hidden">
            {visibleQuotes.map((q) => (
              <div key={q.id} className="flex flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(q.id)}
                      onChange={() => toggleSelected(q.id)}
                      className="mt-1 size-4 accent-teal-600"
                      aria-label={`Selecteer ${q.title}`}
                    />
                    <OfferteEditLink
                      quoteId={q.id}
                      status={q.status}
                      className="font-medium text-ink-500 hover:text-teal-700"
                    >
                      {q.title}
                    </OfferteEditLink>
                  </div>
                  <QuoteStatusBadge status={q.status} title={q.decline_reason ?? undefined} />
                </div>
                <div className="flex items-center justify-between text-xs text-ink-400">
                  <span>{q.clientName ?? "—"}</span>
                  <span>{q.event_date ? formatDate(q.event_date) : "—"}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <QuoteValueCell
                      total={Number(q.total)}
                      currency={q.currency}
                      pricePerPerson={q.price_per_person}
                      aantalPersonen={q.aantal_personen}
                    />
                    <span className="text-xs text-ink-400">
                      Aangemaakt {formatDate(q.created_at)} · Gewijzigd {formatDate(q.updated_at)}
                    </span>
                  </div>
                  <OfferteRowActions quoteId={q.id} title={q.title} status={q.status} shareToken={q.share_token} />
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs font-semibold uppercase tracking-wide text-ink-400">
                  <th className="px-5 py-3">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAllVisible}
                      className="size-4 accent-teal-600"
                      aria-label="Selecteer alle zichtbare offertes"
                    />
                  </th>
                  <th className="px-5 py-3">Offerte</th>
                  <th className="px-5 py-3">Klant</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Eventdatum</th>
                  <th className="px-5 py-3 text-right">Waarde</th>
                  <SortableHeader
                    label="Aangemaakt"
                    column="created_at"
                    activeColumn={sortColumn}
                    direction={sortDirection}
                    onSort={toggleSort}
                  />
                  <SortableHeader
                    label="Laatst gewijzigd"
                    column="updated_at"
                    activeColumn={sortColumn}
                    direction={sortDirection}
                    onSort={toggleSort}
                  />
                  <th className="px-5 py-3 text-right">Acties</th>
                </tr>
              </thead>
              <tbody>
                {visibleQuotes.map((q) => (
                  <tr key={q.id} className="border-b border-ink-50 last:border-0 hover:bg-sand-100">
                    <td className="px-5 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(q.id)}
                        onChange={() => toggleSelected(q.id)}
                        className="size-4 accent-teal-600"
                        aria-label={`Selecteer ${q.title}`}
                      />
                    </td>
                    <td className="px-5 py-3">
                      <OfferteEditLink
                        quoteId={q.id}
                        status={q.status}
                        className="font-medium text-ink-500 hover:text-teal-700"
                      >
                        {q.title}
                      </OfferteEditLink>
                    </td>
                    <td className="px-5 py-3 text-ink-400">{q.clientName ?? "—"}</td>
                    <td className="px-5 py-3">
                      <QuoteStatusBadge status={q.status} title={q.decline_reason ?? undefined} />
                    </td>
                    <td className="px-5 py-3 text-ink-400">{q.event_date ? formatDate(q.event_date) : "—"}</td>
                    <td className="px-5 py-3 text-right">
                      <QuoteValueCell
                        total={Number(q.total)}
                        currency={q.currency}
                        pricePerPerson={q.price_per_person}
                        aantalPersonen={q.aantal_personen}
                        align="right"
                      />
                    </td>
                    <td className="px-5 py-3 text-right text-ink-400">{formatDate(q.created_at)}</td>
                    <td className="px-5 py-3 text-right text-ink-400">{formatDate(q.updated_at)}</td>
                    <td className="px-5 py-3 text-right">
                      <OfferteRowActions quoteId={q.id} title={q.title} status={q.status} shareToken={q.share_token} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ConfirmDialog
        open={bulkDeleteOpen}
        title="Offertes verwijderen"
        description={`Weet je zeker dat je deze ${selectedIds.size} offerte(s) wilt verwijderen? Dit kan niet ongedaan gemaakt worden.`}
        confirmLabel="Verwijderen"
        danger
        pending={bulkDeletePending}
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleteOpen(false)}
      />
    </div>
  );
}
