"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, TextInput } from "@/components/builder/field";
import { Button } from "@/components/ui/button";
import { EVENT_TYPE_OPTIONS } from "@/lib/blocks/event-types";
import type { EventType } from "@/lib/types/database";
import { createTemplate } from "@/app/dashboard/templates/actions";

export default function NieuwTemplatePage() {
  const [name, setName] = useState("");
  const [eventType, setEventType] = useState<EventType>("bedrijfsuitje");
  const [pending, startTransition] = useTransition();

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Nieuw template</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              startTransition(() => createTemplate({ name, eventType }));
            }}
          >
            <Field label="Naam">
              <TextInput
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="bijv. Bedrijfsuitje — Compleet"
                required
                autoFocus
              />
            </Field>

            <Field label="Eventtype">
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as EventType)}
                className="h-10 rounded-brand-sm border border-ink-200 bg-white px-3 text-sm text-ink-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              >
                {EVENT_TYPE_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>

            <Button type="submit" disabled={pending || !name} className="mt-2">
              {pending ? "Bezig…" : "Template aanmaken"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
