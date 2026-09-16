"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { updateInvoiceEmailTemplates } from "./invoicing-actions";

const inputClass =
  "h-10 rounded-brand-sm border border-ink-200 bg-white px-3 text-sm text-ink-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 disabled:opacity-60";
const textareaClass =
  "min-h-24 rounded-brand-sm border border-ink-200 bg-white px-3 py-2 text-sm text-ink-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 disabled:opacity-60";

const PLACEHOLDERS = ["{{klantnaam}}", "{{factuurnummer}}", "{{bedrag}}", "{{vervaldatum}}", "{{factuurtype}}"];

export function InvoiceEmailTemplatesCard({
  canEdit,
  initialSentSubject,
  initialSentBody,
  initialReminderSubject,
  initialReminderBody,
}: {
  canEdit: boolean;
  initialSentSubject: string;
  initialSentBody: string;
  initialReminderSubject: string;
  initialReminderBody: string;
}) {
  const [sentSubject, setSentSubject] = useState(initialSentSubject);
  const [sentBody, setSentBody] = useState(initialSentBody);
  const [reminderSubject, setReminderSubject] = useState(initialReminderSubject);
  const [reminderBody, setReminderBody] = useState(initialReminderBody);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setSaved(false);
    setError(null);
    startTransition(async () => {
      try {
        await updateInvoiceEmailTemplates({ sentSubject, sentBody, reminderSubject, reminderBody });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Opslaan mislukt.");
      }
    });
  }

  return (
    <Card data-faq-id="settings-factuur-email">
      <CardHeader>
        <div>
          <CardTitle>E-mailteksten factuur</CardTitle>
          <CardDescription>
            Pas de inhoud aan van de twee automatische factuur-e-mails. Leeg laten = de standaardtekst blijft
            gelden. Beschikbare variabelen:{" "}
            {PLACEHOLDERS.map((p) => (
              <code key={p} className="mr-1 rounded bg-sand-200 px-1 py-0.5 text-xs">
                {p}
              </code>
            ))}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold text-ink-400">Verstuur-mail (bij &quot;Verstuur factuur&quot;)</p>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-400">
            Onderwerp
            <input
              value={sentSubject}
              onChange={(e) => setSentSubject(e.target.value)}
              disabled={!canEdit}
              placeholder={'Factuur {{factuurnummer}} van jouw organisatie'}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-400">
            Berichttekst
            <textarea
              value={sentBody}
              onChange={(e) => setSentBody(e.target.value)}
              disabled={!canEdit}
              placeholder={`Bijgaand ontvang je factuur {{factuurnummer}} ter waarde van {{bedrag}}. Wij verzoeken je dit te voldoen vóór {{vervaldatum}}.`}
              className={textareaClass}
            />
          </label>
        </div>

        <div className="flex flex-col gap-3 border-t border-ink-100 pt-4">
          <p className="text-xs font-semibold text-ink-400">Herinneringsmail (bij een vervallen vervaldatum)</p>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-400">
            Onderwerp
            <input
              value={reminderSubject}
              onChange={(e) => setReminderSubject(e.target.value)}
              disabled={!canEdit}
              placeholder={'Herinnering: factuur {{factuurnummer}}'}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-400">
            Berichttekst
            <textarea
              value={reminderBody}
              onChange={(e) => setReminderBody(e.target.value)}
              disabled={!canEdit}
              placeholder={`De vervaldatum van factuur {{factuurnummer}} ({{bedrag}}) is op {{vervaldatum}} verstreken. Wil je dit alsnog overmaken?`}
              className={textareaClass}
            />
          </label>
        </div>

        {canEdit && (
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" size="sm" onClick={save} disabled={pending}>
              {pending ? "Bezig…" : "Opslaan"}
            </Button>
            {saved && <span className="text-xs text-teal-700">Opgeslagen</span>}
            {error && <span className="text-xs text-red-600">{error}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
