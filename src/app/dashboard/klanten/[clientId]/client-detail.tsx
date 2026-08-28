"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, FileDown, Mail, Phone } from "lucide-react";
import type { Database } from "@/lib/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuoteStatusBadge } from "@/components/ui/badge";
import { Field, TextInput, TextArea } from "@/components/builder/field";
import { Button } from "@/components/ui/button";
import { AutosaveIndicator } from "@/components/builder/autosave-indicator";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAutosave } from "@/hooks/use-autosave";
import { formatCurrency, formatDate } from "@/lib/utils";
import { updateClient, deleteClient } from "@/app/dashboard/klanten/actions";

type ClientRow = Database["public"]["Tables"]["clients"]["Row"];
type QuoteRow = {
  id: string;
  title: string;
  status: Database["public"]["Tables"]["quotes"]["Row"]["status"];
  total: number;
  currency: string;
  event_date: string | null;
  updated_at: string;
  share_token: string;
};

export function ClientDetail({
  client,
  quotes,
  quoteIdsWithCertificate,
}: {
  client: ClientRow;
  quotes: QuoteRow[];
  quoteIdsWithCertificate: string[];
}) {
  const router = useRouter();
  const [name, setName] = useState(client.name);
  const [email, setEmail] = useState(client.email ?? "");
  const [phone, setPhone] = useState(client.phone ?? "");
  const [notes, setNotes] = useState(client.notes ?? "");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletePending, startDeleteTransition] = useTransition();
  const certificateSet = new Set(quoteIdsWithCertificate);

  const acceptedValue = quotes
    .filter((q) => q.status === "geaccepteerd")
    .reduce((sum, q) => sum + Number(q.total), 0);

  const status = useAutosave({ name, email, phone, notes }, async (value) => {
    await updateClient(client.id, value);
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/klanten"
            className="flex size-9 items-center justify-center rounded-brand-sm text-ink-400 hover:bg-sand-200"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="font-display text-xl font-semibold text-ink-500 outline-none focus:border-b focus:border-teal-400"
            />
            <div className="mt-0.5">
              <AutosaveIndicator status={status} />
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmOpen(true)}>
          <Trash2 className="size-4" />
        </Button>

        <ConfirmDialog
          open={deleteConfirmOpen}
          title="Klant verwijderen"
          description={`Weet je zeker dat je klant "${name}" wilt verwijderen?`}
          confirmLabel="Verwijderen"
          danger
          pending={deletePending}
          onConfirm={() => {
            startDeleteTransition(async () => {
              await deleteClient(client.id);
              router.push("/dashboard/klanten");
            });
          }}
          onCancel={() => setDeleteConfirmOpen(false)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1.4fr]">
        <Card>
          <CardHeader>
            <CardTitle>Contactgegevens</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Field label="E-mailadres">
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-300" />
                <TextInput
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                />
              </div>
            </Field>
            <Field label="Telefoonnummer">
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-300" />
                <TextInput value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-9" />
              </div>
            </Field>
            <Field label="Interne notities">
              <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-28" />
            </Field>
            <div className="mt-1 grid grid-cols-2 gap-3 border-t border-ink-100 pt-4 text-sm">
              <div>
                <p className="text-xs text-ink-400">Aantal offertes</p>
                <p className="font-display text-lg font-semibold text-ink-500">{quotes.length}</p>
              </div>
              <div>
                <p className="text-xs text-ink-400">Geaccepteerde waarde</p>
                <p className="font-display text-lg font-semibold text-ink-500">
                  {acceptedValue > 0 ? formatCurrency(acceptedValue) : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Eventgeschiedenis</CardTitle>
          </CardHeader>
          <CardContent>
            {quotes.length === 0 ? (
              <p className="text-sm text-ink-400">Nog geen offertes voor deze klant.</p>
            ) : (
              <div className="flex flex-col divide-y divide-ink-100">
                {quotes.map((q) => (
                  <div key={q.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0 flex-1">
                      <a
                        href={`/dashboard/offertes/${q.id}`}
                        className="truncate font-medium text-ink-500 hover:text-teal-700"
                      >
                        {q.title}
                      </a>
                      <p className="text-xs text-ink-400">
                        {q.event_date ? formatDate(q.event_date) : "Geen eventdatum"} · Gewijzigd {formatDate(q.updated_at)}
                      </p>
                    </div>
                    <QuoteStatusBadge status={q.status} />
                    <span className="w-24 shrink-0 text-right text-sm font-semibold text-ink-500">
                      {formatCurrency(Number(q.total), q.currency)}
                    </span>
                    {certificateSet.has(q.id) && (
                      <a
                        href={`/offerte/${q.share_token}/certificaat`}
                        title="Download ondertekeningscertificaat"
                        className="flex size-8 shrink-0 items-center justify-center rounded-brand-sm text-teal-600 hover:bg-teal-50"
                      >
                        <FileDown className="size-4" />
                      </a>
                    )}
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
