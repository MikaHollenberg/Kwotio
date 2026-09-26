"use client";

import { useState, useTransition } from "react";
import { Users, Trash2, X, Plus } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ExportCsvButton } from "@/components/dashboard/export-csv-button";
import { ClientNotesButton } from "@/components/dashboard/client-notes-button";
import { ClientRowActions } from "./client-row-actions";
import { deleteClients } from "./actions";
import { formatCurrency, formatDate } from "@/lib/utils";

export type ClientRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  notes: string | null;
  created_at: string;
  quoteCount: number;
  acceptedValue: number;
};

export function KlantenTable({ clients }: { clients: ClientRow[] }) {
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

  function toggleSelectAll() {
    setSelectedIds((prev) => (prev.size === clients.length ? new Set() : new Set(clients.map((c) => c.id))));
  }

  function handleBulkDelete() {
    startBulkDeleteTransition(async () => {
      await deleteClients([...selectedIds]);
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
    });
  }

  function toCsvRow(c: ClientRow) {
    return {
      Naam: c.name,
      Bedrijf: c.company_name ?? "",
      "E-mail": c.email ?? "",
      Telefoon: c.phone ?? "",
      Offertes: c.quoteCount,
      "Geaccepteerde waarde": c.acceptedValue,
      "Klant sinds": formatDate(c.created_at),
    };
  }

  const selectedClients = clients.filter((c) => selectedIds.has(c.id));
  const allSelected = clients.length > 0 && selectedIds.size === clients.length;

  return (
    <>
      {selectedIds.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-brand-sm border border-teal-200 bg-teal-50 px-4 py-2.5">
          <p className="text-sm font-medium text-teal-800">{selectedIds.size} geselecteerd</p>
          <div className="ml-auto flex items-center gap-2">
            <ExportCsvButton rows={selectedClients.map(toCsvRow)} filename="klanten-selectie.csv" label="Exporteer selectie" />
            <Button variant="outline" size="sm" onClick={() => setBulkDeleteOpen(true)} className="text-red-600 hover:bg-red-50">
              <Trash2 className="size-4" /> Verwijderen
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())} title="Selectie wissen">
              <X className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {clients.length === 0 ? (
        <Card data-faq-id="klanten-list" className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <Users className="kw-bob size-8 text-ink-300" />
          <p className="text-sm text-ink-400">
            Nog geen klanten. Ze worden ook automatisch aangemaakt zodra je een offerte voor iemand nieuws maakt.
          </p>
          <ButtonLink href="/dashboard/klanten/nieuw" size="sm" className="mt-1">
            <Plus className="size-4" /> Eerste klant toevoegen
          </ButtonLink>
        </Card>
      ) : (
        <Card data-faq-id="klanten-list" className="overflow-hidden">
          <div className="flex flex-col divide-y divide-ink-50 sm:hidden">
            {clients.map((c) => (
              <div key={c.id} className="flex flex-col gap-2 p-4">
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(c.id)}
                    onChange={() => toggleSelected(c.id)}
                    className="mt-1 size-4 accent-teal-600"
                    aria-label={`Selecteer ${c.name}`}
                  />
                  <a href={`/dashboard/klanten/${c.id}`} className="flex-1">
                    <span className="font-medium text-ink-500">{c.name}</span>
                    <span className="block text-xs text-ink-400">
                      {[c.company_name, c.email || c.phone].filter(Boolean).join(" · ") || "—"}
                    </span>
                    <div className="flex items-center justify-between pt-1 text-xs text-ink-400">
                      <span>{c.quoteCount} offertes · klant sinds {formatDate(c.created_at)}</span>
                      <span className="font-medium text-ink-500">
                        {c.acceptedValue > 0 ? formatCurrency(c.acceptedValue) : "—"}
                      </span>
                    </div>
                  </a>
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
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="size-4 accent-teal-600"
                      aria-label="Selecteer alle klanten"
                    />
                  </th>
                  <th className="px-5 py-3">Naam</th>
                  <th className="px-5 py-3">Bedrijf</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3 text-right">Offertes</th>
                  <th className="px-5 py-3 text-right">Geaccepteerde waarde</th>
                  <th className="px-5 py-3 text-right">Klant sinds</th>
                  <th className="px-5 py-3"></th>
                  <th className="px-5 py-3 text-right">Acties</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id} className="kw-glow-row border-b border-ink-50 last:border-0">
                    <td className="px-5 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(c.id)}
                        onChange={() => toggleSelected(c.id)}
                        className="size-4 accent-teal-600"
                        aria-label={`Selecteer ${c.name}`}
                      />
                    </td>
                    <td className="px-5 py-3">
                      <a href={`/dashboard/klanten/${c.id}`} className="font-medium text-ink-500 hover:text-teal-700">
                        {c.name}
                      </a>
                    </td>
                    <td className="px-5 py-3 text-ink-400">{c.company_name || "—"}</td>
                    <td className="px-5 py-3 text-ink-400">{c.email || c.phone || "—"}</td>
                    <td className="px-5 py-3 text-right text-ink-500">{c.quoteCount}</td>
                    <td className="px-5 py-3 text-right font-medium text-ink-500">
                      {c.acceptedValue > 0 ? formatCurrency(c.acceptedValue) : "—"}
                    </td>
                    <td className="px-5 py-3 text-right text-ink-400">{formatDate(c.created_at)}</td>
                    <td className="px-5 py-3 text-right">
                      {c.notes && <ClientNotesButton clientName={c.name} notes={c.notes} />}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <ClientRowActions clientId={c.id} name={c.name} archived={false} />
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
        title="Klanten verwijderen"
        description={`Weet je zeker dat je deze ${selectedIds.size} klant(en) wilt verwijderen? Ze verhuizen naar de prullenbak en blijven daar 30 dagen herstelbaar.`}
        confirmLabel="Verwijderen"
        danger
        pending={bulkDeletePending}
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleteOpen(false)}
      />
    </>
  );
}
