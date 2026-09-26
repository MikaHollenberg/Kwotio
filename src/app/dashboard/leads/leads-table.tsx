"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { UserPlus, Search, ArrowRight, CalendarClock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge, tones } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, cn } from "@/lib/utils";
import { LEAD_STATUS_LABELS, LEAD_STATUS_TONES, LEAD_PURPOSE_LABELS } from "./status";
import { markLeadContacted, rejectLead, convertLeadToRequest, setLeadReminder } from "./actions";
import type { LeadStatus } from "@/lib/types/database";

const STATUS_ORDER = Object.keys(LEAD_STATUS_LABELS) as LeadStatus[];

type LeadRow = {
  id: string;
  name: string;
  company_name: string | null;
  email: string;
  phone: string;
  purpose: "uitje" | "arrangement" | "overig";
  guest_count: number;
  preferred_date: string;
  message: string | null;
  status: LeadStatus;
  converted_request_id: string | null;
  created_at: string;
  reminder_date: string | null;
};

function LeadCard({ lead }: { lead: LeadRow }) {
  const [pending, startTransition] = useTransition();
  const [reminderDate, setReminderDate] = useState(lead.reminder_date ?? "");

  return (
    <div data-faq-id={`lead-card-${lead.id}`} className="flex flex-col gap-3 border-b border-sand-200 px-5 py-4.5 last:border-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-[15px] font-semibold text-ink-500">
          {lead.name}
          {lead.company_name && <span className="font-normal text-ink-300"> &middot; {lead.company_name}</span>}
        </p>
        <Badge tone={LEAD_STATUS_TONES[lead.status]}>{LEAD_STATUS_LABELS[lead.status]}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3 lg:grid-cols-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-300">E-mail</p>
          <p className="mt-0.5 truncate text-[12.5px] font-medium text-ink-500">{lead.email}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-300">Telefoon</p>
          <p className="mt-0.5 text-[12.5px] font-medium text-ink-500">{lead.phone}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-300">Waarvoor</p>
          <p className="mt-0.5 text-[12.5px] font-medium text-ink-500">{LEAD_PURPOSE_LABELS[lead.purpose]}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-300">Aantal personen</p>
          <p className="mt-0.5 text-[12.5px] font-medium text-ink-500">&plusmn; {lead.guest_count}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-300">Voorkeursdatum</p>
          <p className="mt-0.5 text-[12.5px] font-medium text-ink-500">{formatDate(lead.preferred_date)}</p>
        </div>
      </div>

      {lead.message && <p className="text-[12.5px] italic text-ink-400">&ldquo;{lead.message}&rdquo;</p>}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <p className="text-[11px] text-ink-300">Binnengekomen op {formatDate(lead.created_at)}</p>
          <label
            title="Follow-up-herinnering -- verschijnt in de meldingenbel zodra deze datum is aangebroken."
            className="flex items-center gap-1 text-[11px] font-medium text-ink-400"
          >
            <CalendarClock className="size-3.5" />
            <input
              type="date"
              value={reminderDate}
              onChange={(e) => {
                const next = e.target.value;
                setReminderDate(next);
                startTransition(() => setLeadReminder(lead.id, next || null));
              }}
              className="rounded-brand-sm border border-ink-200 bg-white px-1.5 py-0.5 text-[11px] text-ink-500 outline-none focus:border-teal-500"
            />
          </label>
        </div>
        {lead.status === "omgezet" && lead.converted_request_id ? (
          <Link
            href={`/dashboard/aanvragen/${lead.converted_request_id}`}
            className="flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700"
          >
            Bekijk aanvraag <ArrowRight className="size-3.5" />
          </Link>
        ) : lead.status === "afgewezen" ? null : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => startTransition(() => rejectLead(lead.id))}
              className="text-xs font-medium text-ink-300 hover:text-red-600 disabled:opacity-60"
            >
              Afwijzen
            </button>
            {lead.status === "nieuw" && (
              <Button
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={() => startTransition(() => markLeadContacted(lead.id))}
              >
                Gecontacteerd
              </Button>
            )}
            <Button size="sm" disabled={pending} onClick={() => startTransition(() => convertLeadToRequest(lead.id))}>
              Omzetten <ArrowRight className="size-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function LeadsTable({ leads }: { leads: LeadRow[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Set<LeadStatus>>(new Set());

  function toggleStatus(status: LeadStatus) {
    setStatusFilter((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  }

  const visibleLeads = useMemo(() => {
    const query = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (statusFilter.size > 0 && !statusFilter.has(l.status)) return false;
      if (query) {
        const haystack = `${l.name} ${l.company_name ?? ""} ${l.email}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [leads, search, statusFilter]);

  if (leads.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-sm text-ink-400">Interesse vóór een echte aanvraag</p>
          <h2 className="font-display text-2xl font-semibold text-ink-500">Leads</h2>
        </div>
        <Card data-faq-id="leads-list" className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <UserPlus className="kw-bob size-8 text-ink-300" />
          <p className="text-sm text-ink-400">
            Nog geen leads binnengekomen. Bezoekers die nog niet zeker weten wat ze zoeken, kunnen op je publieke
            offertepagina hun gegevens achterlaten via &ldquo;Neem contact op&rdquo;.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-ink-400">Interesse vóór een echte aanvraag</p>
        <h2 className="font-display text-2xl font-semibold text-ink-500">Leads</h2>
      </div>

      <div data-faq-id="leads-search-filter" className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-300" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek op naam, bedrijf of e-mail…"
            className="h-10 w-64 rounded-brand-sm border border-ink-200 bg-white pl-9 pr-3 text-sm text-ink-500 outline-none transition-colors duration-200 ease-brand placeholder:text-ink-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
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
                  active ? tones[LEAD_STATUS_TONES[status]] : "border-ink-200 text-ink-400 hover:border-ink-300 hover:text-ink-500",
                )}
              >
                {LEAD_STATUS_LABELS[status]}
              </button>
            );
          })}
        </div>
      </div>

      {visibleLeads.length === 0 ? (
        <Card data-faq-id="leads-list" className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <UserPlus className="size-8 text-ink-300" />
          <p className="text-sm text-ink-400">Geen leads gevonden voor deze zoekopdracht/filter.</p>
        </Card>
      ) : (
        <Card data-faq-id="leads-list" className="overflow-hidden">
          {visibleLeads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </Card>
      )}
    </div>
  );
}
