"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Inbox, Search, ChevronUp, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge, tones } from "@/components/ui/badge";
import { formatDate, cn } from "@/lib/utils";
import { REQUEST_STATUS_LABELS, REQUEST_STATUS_TONES } from "./status";
import { AanvraagRowActions } from "./aanvraag-row-actions";
import type { QuoteRequestStatus } from "@/lib/types/database";

const STATUS_ORDER = Object.keys(REQUEST_STATUS_LABELS) as QuoteRequestStatus[];

type RequestRow = {
  id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  status: QuoteRequestStatus;
  templateName: string | null;
  created_at: string;
};

export function AanvragenTable({ requests }: { requests: RequestRow[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Set<QuoteRequestStatus>>(new Set());
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  function toggleStatus(status: QuoteRequestStatus) {
    setStatusFilter((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  }

  const visibleRequests = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = requests.filter((r) => {
      if (statusFilter.size > 0 && !statusFilter.has(r.status)) return false;
      if (query) {
        const haystack = `${r.customer_name} ${r.customer_email ?? ""}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
    return [...filtered].sort((a, b) => {
      const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortDirection === "desc" ? -diff : diff;
    });
  }, [requests, search, statusFilter, sortDirection]);

  if (requests.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-sm text-ink-400">Aanvragen via de publieke offertepagina</p>
          <h2 className="font-display text-2xl font-semibold text-ink-500">Offerte-aanvragen</h2>
        </div>
        <Card className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <Inbox className="size-8 text-ink-300" />
          <p className="text-sm text-ink-400">
            Nog geen aanvragen binnengekomen. Zet een template op &quot;publiek zichtbaar&quot; en deel je
            publieke offertepagina om aanvragen te ontvangen.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-ink-400">Aanvragen via de publieke offertepagina</p>
        <h2 className="font-display text-2xl font-semibold text-ink-500">Offerte-aanvragen</h2>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-300" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek op naam of e-mail…"
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
                  active
                    ? tones[REQUEST_STATUS_TONES[status]]
                    : "border-ink-200 text-ink-400 hover:border-ink-300 hover:text-ink-500",
                )}
              >
                {REQUEST_STATUS_LABELS[status]}
              </button>
            );
          })}
        </div>
      </div>

      {visibleRequests.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <Inbox className="size-8 text-ink-300" />
          <p className="text-sm text-ink-400">Geen aanvragen gevonden voor deze zoekopdracht/filter.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="flex flex-col divide-y divide-ink-50 sm:hidden">
            {visibleRequests.map((r) => (
              <div key={r.id} className="flex flex-col gap-2 p-4">
                <Link href={`/dashboard/aanvragen/${r.id}`} className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-medium text-ink-500">{r.customer_name}</span>
                    <Badge tone={REQUEST_STATUS_TONES[r.status]}>{REQUEST_STATUS_LABELS[r.status]}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-ink-400">
                    <span>{r.templateName ?? "—"}</span>
                    <span>{formatDate(r.created_at)}</span>
                  </div>
                </Link>
                <div className="flex justify-end">
                  <AanvraagRowActions requestId={r.id} customerName={r.customer_name} />
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs font-semibold uppercase tracking-wide text-ink-400">
                  <th className="px-5 py-3">Naam</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3">Template</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSortDirection((d) => (d === "desc" ? "asc" : "desc"))}
                      className="inline-flex items-center gap-1 text-ink-500 hover:text-ink-500"
                    >
                      Aangevraagd op
                      {sortDirection === "desc" ? <ChevronDown className="size-3.5" /> : <ChevronUp className="size-3.5" />}
                    </button>
                  </th>
                  <th className="px-5 py-3 text-right">Acties</th>
                </tr>
              </thead>
              <tbody>
                {visibleRequests.map((r) => (
                  <tr key={r.id} className="border-b border-ink-50 last:border-0 hover:bg-sand-100">
                    <td className="px-5 py-3">
                      <Link href={`/dashboard/aanvragen/${r.id}`} className="font-medium text-ink-500 hover:text-teal-700">
                        {r.customer_name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-ink-400">{r.customer_email ?? r.customer_phone ?? "—"}</td>
                    <td className="px-5 py-3 text-ink-400">{r.templateName ?? "—"}</td>
                    <td className="px-5 py-3">
                      <Badge tone={REQUEST_STATUS_TONES[r.status]}>{REQUEST_STATUS_LABELS[r.status]}</Badge>
                    </td>
                    <td className="px-5 py-3 text-right text-ink-400">{formatDate(r.created_at)}</td>
                    <td className="px-5 py-3 text-right">
                      <AanvraagRowActions requestId={r.id} customerName={r.customer_name} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
