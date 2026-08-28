"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AutosaveIndicator } from "@/components/builder/autosave-indicator";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAutosave } from "@/hooks/use-autosave";
import type { EmailTriggerType } from "@/lib/types/database";
import { createEmailRule, updateEmailRule, deleteEmailRule, type EmailRuleFields } from "./actions";

export type EmailRule = {
  id: string;
  name: string;
  triggerType: EmailTriggerType;
  triggerDays: number;
  subject: string;
  body: string;
  enabled: boolean;
};

const TRIGGER_LABELS: Record<EmailTriggerType, string> = {
  days_after_sent_no_reaction: "Dagen na verzenden zonder reactie",
  days_before_event: "Dagen voor evenementdatum",
};

const inputClass =
  "h-10 w-full rounded-brand-sm border border-ink-200 bg-white px-3 text-sm text-ink-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 disabled:opacity-60";
const textareaClass =
  "w-full rounded-brand-sm border border-ink-200 bg-white px-3 py-2 text-sm text-ink-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 disabled:opacity-60";

function RuleEditor({
  rule,
  canEdit,
  onDeleted,
}: {
  rule: EmailRule;
  canEdit: boolean;
  onDeleted: () => void;
}) {
  const [fields, setFields] = useState<EmailRuleFields>({
    name: rule.name,
    triggerType: rule.triggerType,
    triggerDays: rule.triggerDays,
    subject: rule.subject,
    body: rule.body,
    enabled: rule.enabled,
  });
  const status = useAutosave(fields, (value) => updateEmailRule(rule.id, value));
  const [deleting, startDeleteTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof EmailRuleFields>(key: K) => (value: EmailRuleFields[K]) =>
    setFields((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink-500">Naam (voor jezelf)</span>
          <input
            type="text"
            value={fields.name}
            disabled={!canEdit}
            onChange={(e) => set("name")(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink-500">Verstuur op basis van</span>
          <select
            value={fields.triggerType}
            disabled={!canEdit}
            onChange={(e) => set("triggerType")(e.target.value as EmailTriggerType)}
            className={inputClass}
          >
            {(Object.entries(TRIGGER_LABELS) as [EmailTriggerType, string][]).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink-500">Aantal dagen</span>
          <input
            type="number"
            min={0}
            max={90}
            value={fields.triggerDays}
            disabled={!canEdit}
            onChange={(e) => set("triggerDays")(Number(e.target.value))}
            className={inputClass}
          />
        </label>

        <label className="flex items-center gap-2 pt-6">
          <input
            type="checkbox"
            checked={fields.enabled}
            disabled={!canEdit}
            onChange={(e) => set("enabled")(e.target.checked)}
            className="size-4 accent-teal-600"
          />
          <span className="text-sm font-medium text-ink-500">Actief</span>
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink-500">Onderwerp</span>
        <input
          type="text"
          value={fields.subject}
          disabled={!canEdit}
          onChange={(e) => set("subject")(e.target.value)}
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink-500">Inhoud</span>
        <textarea
          rows={4}
          value={fields.body}
          disabled={!canEdit}
          onChange={(e) => set("body")(e.target.value)}
          className={textareaClass}
        />
      </label>

      {canEdit && (
        <div className="flex items-center justify-between">
          <AutosaveIndicator status={status} />
          <Button variant="ghost" size="sm" disabled={deleting} onClick={() => setConfirmOpen(true)}>
            <Trash2 className="size-4" /> {deleting ? "Bezig…" : "Verwijderen"}
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="E-mail verwijderen"
        description={`Weet je zeker dat je "${fields.name}" wilt verwijderen?`}
        confirmLabel="Verwijderen"
        danger
        pending={deleting}
        onConfirm={() => {
          startDeleteTransition(async () => {
            try {
              await deleteEmailRule(rule.id);
              setConfirmOpen(false);
              onDeleted();
            } catch {
              setConfirmOpen(false);
              setError("Kon de e-mail niet verwijderen. Probeer het opnieuw.");
            }
          });
        }}
        onCancel={() => setConfirmOpen(false)}
      />
      <ConfirmDialog
        open={!!error}
        title="Verwijderen mislukt"
        description={error ?? ""}
        confirmLabel="Oké"
        hideCancel
        onConfirm={() => setError(null)}
        onCancel={() => setError(null)}
      />
    </div>
  );
}

export function EmailAutomationCard({ rules, canEdit }: { rules: EmailRule[]; canEdit: boolean }) {
  const [selectedId, setSelectedId] = useState<string | null>(rules[0]?.id ?? null);
  const [pendingCreate, setPendingCreate] = useState(false);
  const selectedRule = rules.find((r) => r.id === selectedId) ?? null;

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>E-mailautomatisering</CardTitle>
          <CardDescription>
            Beheer je automatische klant-e-mails: wanneer ze verstuurd worden en wat erin staat.
            Beschikbare variabelen:{" "}
            <code className="rounded bg-sand-200 px-1 py-0.5 text-xs">{"{{klantnaam}}"}</code>{" "}
            <code className="rounded bg-sand-200 px-1 py-0.5 text-xs">{"{{offertetitel}}"}</code>{" "}
            <code className="rounded bg-sand-200 px-1 py-0.5 text-xs">{"{{evenementdatum}}"}</code>{" "}
            <code className="rounded bg-sand-200 px-1 py-0.5 text-xs">{"{{link}}"}</code> — de knop
            naar de offerte staat sowieso altijd onder de mail.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <select
            value={selectedId ?? ""}
            onChange={(e) => setSelectedId(e.target.value)}
            className={inputClass}
          >
            {rules.length === 0 && <option value="">Nog geen e-mails</option>}
            {rules.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} {r.enabled ? "" : "(uit)"}
              </option>
            ))}
          </select>
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              disabled={pendingCreate}
              className="shrink-0"
              onClick={async () => {
                setPendingCreate(true);
                try {
                  const id = await createEmailRule({
                    name: "Nieuwe e-mail",
                    triggerType: "days_after_sent_no_reaction",
                    triggerDays: 3,
                    subject: 'Over je offerte "{{offertetitel}}"',
                    body: "Hoi {{klantnaam}},",
                    enabled: true,
                  });
                  setSelectedId(id);
                } finally {
                  setPendingCreate(false);
                }
              }}
            >
              <Plus className="size-4" /> Nieuwe e-mail
            </Button>
          )}
        </div>

        {selectedRule && (
          <RuleEditor
            key={selectedRule.id}
            rule={selectedRule}
            canEdit={canEdit}
            onDeleted={() => setSelectedId(rules.find((r) => r.id !== selectedRule.id)?.id ?? null)}
          />
        )}
      </CardContent>
    </Card>
  );
}
