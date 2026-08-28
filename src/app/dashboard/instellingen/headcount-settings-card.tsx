"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updateHeadcountSettings } from "./actions";

const textareaClass =
  "w-full rounded-brand-sm border border-ink-200 bg-white px-3 py-2 text-sm text-ink-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 disabled:opacity-60";

export function HeadcountSettingsCard({
  initialActief,
  initialKanttekening,
  canEdit,
}: {
  initialActief: boolean;
  initialKanttekening: string;
  canEdit: boolean;
}) {
  const [actief, setActief] = useState(initialActief);
  const [kanttekening, setKanttekening] = useState(initialKanttekening);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save(next: { actief: boolean; kanttekening: string }) {
    setSaved(false);
    setError(null);
    startTransition(async () => {
      try {
        await updateHeadcountSettings(next);
        setSaved(true);
      } catch {
        setError("Opslaan mislukt.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Aantal personen bij ondertekening</CardTitle>
          <CardDescription>
            Laat de klant bij het ondertekenen het definitieve aantal personen invullen — handig
            voor evenementen-offertes. Staat standaard uit; per offerte apart aan te zetten zodra
            dit hier actief staat.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <label className="flex items-center gap-2.5">
          <input
            type="checkbox"
            checked={actief}
            disabled={!canEdit}
            onChange={(e) => {
              const next = e.target.checked;
              setActief(next);
              save({ actief: next, kanttekening });
            }}
            className="size-4 accent-teal-600 disabled:opacity-60"
          />
          <span className="text-sm font-medium text-ink-500">
            Aantal personen laten invullen bij ondertekening
          </span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-ink-400">
            Kanttekening — kleine toelichtingstekst naast het invulveld op het ondertekenscherm
          </span>
          <textarea
            rows={3}
            value={kanttekening}
            disabled={!canEdit}
            onChange={(e) => {
              setKanttekening(e.target.value);
              setSaved(false);
            }}
            onBlur={() => save({ actief, kanttekening })}
            placeholder="bijv. Uiterlijk 2 weken vooraf horen wij graag het definitieve aantal personen dat komt."
            className={textareaClass}
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {pending && <p className="text-xs text-ink-400">Bezig met opslaan…</p>}
        {saved && !pending && <p className="text-xs text-emerald-600">Opgeslagen.</p>}
      </CardContent>
    </Card>
  );
}
