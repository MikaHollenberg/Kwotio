"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, TextInput, TextArea } from "@/components/builder/field";
import { Button } from "@/components/ui/button";
import { createClientAndRedirect } from "@/app/dashboard/klanten/actions";

export default function NieuweKlantPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Nieuwe klant</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              startTransition(() => createClientAndRedirect({ name, email, phone, notes }));
            }}
          >
            <Field label="Naam">
              <TextInput value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
            </Field>
            <Field label="E-mailadres">
              <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Telefoonnummer">
              <TextInput value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
            <Field label="Interne notities">
              <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>
            <Button type="submit" disabled={pending || !name} className="mt-2">
              {pending ? "Bezig…" : "Klant aanmaken"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
