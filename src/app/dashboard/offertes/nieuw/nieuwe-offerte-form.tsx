"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Sparkles, FileX, ChevronDown, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, TextInput } from "@/components/builder/field";
import { ClientCombobox, type SelectedClient } from "@/components/builder/client-combobox";
import { Button } from "@/components/ui/button";
import { createQuote } from "@/app/dashboard/offertes/actions";
import { cn } from "@/lib/utils";

type TemplateOption = { id: string; name: string; event_type: string };

function TemplateDropdown({
  templates,
  selectedId,
  onSelect,
}: {
  templates: TemplateOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = templates.find((t) => t.id === selectedId) ?? null;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-3 rounded-brand-sm border-2 px-3.5 py-3 text-left transition-colors duration-200 ease-brand",
          selected ? "border-teal-500 bg-teal-50" : "border-ink-100 hover:border-ink-200",
        )}
      >
        <Sparkles className="size-4 shrink-0 text-ink-400" />
        <div className="min-w-0 flex-1">
          {selected ? (
            <>
              <p className="text-sm font-medium text-ink-500">{selected.name}</p>
              <p className="text-xs text-ink-400">{selected.event_type}</p>
            </>
          ) : (
            <p className="text-sm font-medium text-ink-400">Kies een template…</p>
          )}
        </div>
        <ChevronDown className={cn("size-4 shrink-0 text-ink-300 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1.5 max-h-60 w-full overflow-y-auto rounded-brand-sm border border-ink-200 bg-white p-1.5 shadow-lg">
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                onSelect(t.id);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between gap-2 rounded-brand-sm px-3 py-2.5 text-left text-sm hover:bg-sand-100"
            >
              <span className="min-w-0">
                <span className="font-medium text-ink-500">{t.name}</span>
                <span className="ml-2 text-xs text-ink-400">{t.event_type}</span>
              </span>
              {t.id === selectedId && <Check className="size-4 shrink-0 text-teal-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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

                {templates.length > 0 && (
                  <TemplateDropdown templates={templates} selectedId={templateId} onSelect={setTemplateId} />
                )}
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
