"use client";

import { useState, useTransition } from "react";
import { Sparkles, FileX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, TextInput } from "@/components/builder/field";
import { ClientCombobox, type SelectedClient } from "@/components/builder/client-combobox";
import { Button } from "@/components/ui/button";
import { EVENT_TYPE_LABELS } from "@/lib/blocks/event-types";
import type { EventType } from "@/lib/types/database";
import { createQuote } from "@/app/dashboard/offertes/actions";
import { cn } from "@/lib/utils";

type TemplateOption = { id: string; name: string; event_type: EventType };

export function NieuweOfferteForm({ templates }: { templates: TemplateOption[] }) {
  const [title, setTitle] = useState("");
  const [client, setClient] = useState<SelectedClient | null>(null);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [eventDate, setEventDate] = useState("");
  const [pending, startTransition] = useTransition();

  const canSubmit = title.trim().length > 0 && client;

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Nieuwe offerte</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (!client) return;
              startTransition(() =>
                createQuote({
                  title: title.trim(),
                  clientId: client.id,
                  templateId,
                  eventDate: eventDate || null,
                }),
              );
            }}
          >
            <Field label="Offertetitel">
              <TextInput
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="bijv. Bedrijfsuitje team Sales — 12 juli"
                autoFocus
                required
              />
            </Field>

            <Field label="Klant">
              <ClientCombobox value={client} onChange={setClient} />
            </Field>

            <Field label="Eventdatum (optioneel)">
              <TextInput type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
            </Field>

            <div>
              <p className="mb-2 text-xs font-semibold text-ink-400">Starten vanaf</p>
              <div className="grid gap-2">
                <button
                  type="button"
                  onClick={() => setTemplateId(null)}
                  className={cn(
                    "flex items-center gap-3 rounded-brand-sm border-2 px-3.5 py-3 text-left transition-colors duration-200 ease-brand",
                    templateId === null ? "border-teal-500 bg-teal-50" : "border-ink-100 hover:border-ink-200",
                  )}
                >
                  <FileX className="size-4 text-ink-400" />
                  <div>
                    <p className="text-sm font-medium text-ink-500">Vanaf nul</p>
                    <p className="text-xs text-ink-400">Volledig maatwerk, geen blokken vooraf ingevuld.</p>
                  </div>
                </button>

                {templates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTemplateId(t.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-brand-sm border-2 px-3.5 py-3 text-left transition-colors duration-200 ease-brand",
                      templateId === t.id ? "border-teal-500 bg-teal-50" : "border-ink-100 hover:border-ink-200",
                    )}
                  >
                    <Sparkles className="size-4 text-ink-400" />
                    <div>
                      <p className="text-sm font-medium text-ink-500">{t.name}</p>
                      <p className="text-xs text-ink-400">{EVENT_TYPE_LABELS[t.event_type]}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" disabled={!canSubmit || pending} className="mt-1">
              {pending ? "Bezig…" : "Offerte aanmaken"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
