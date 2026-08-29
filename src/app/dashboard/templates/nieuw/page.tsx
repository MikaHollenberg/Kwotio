"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, TextInput } from "@/components/builder/field";
import { Button } from "@/components/ui/button";
import { createTemplate } from "@/app/dashboard/templates/actions";

export default function NieuwTemplatePage() {
  const [name, setName] = useState("");
  const [eventType, setEventType] = useState("");
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

            <Field label="Type offerte">
              <TextInput
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                placeholder="bijv. Bedrijfsuitje, Vrijgezellenfeest, BBQ-avond…"
                required
              />
            </Field>

            <Button type="submit" disabled={pending || !name || !eventType} className="mt-2">
              {pending ? "Bezig…" : "Template aanmaken"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
