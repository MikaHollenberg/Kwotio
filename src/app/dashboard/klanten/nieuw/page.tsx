"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, TextInput, TextArea } from "@/components/builder/field";
import { Button } from "@/components/ui/button";
import { createClientAndRedirect, checkDuplicateClient, type DuplicateClientMatch } from "@/app/dashboard/klanten/actions";

export default function NieuweKlantPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();
  const [duplicate, setDuplicate] = useState<DuplicateClientMatch | null>(null);
  const [checking, setChecking] = useState(false);

  function submit() {
    // Al een keer gecheckt voor precies deze gegevens en de gebruiker klikt
    // nu een tweede keer -- dat telt als "toch aanmaken", niet opnieuw checken.
    if (duplicate) {
      startTransition(() => createClientAndRedirect({ name, email, phone, companyName, notes }));
      return;
    }
    setChecking(true);
    startTransition(async () => {
      const match = await checkDuplicateClient(email, phone);
      setChecking(false);
      if (match) {
        setDuplicate(match);
        return;
      }
      await createClientAndRedirect({ name, email, phone, companyName, notes });
    });
  }

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
              submit();
            }}
          >
            <Field label="Naam">
              <TextInput value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
            </Field>
            <Field label="E-mailadres">
              <TextInput
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setDuplicate(null);
                }}
                required
              />
            </Field>
            <Field label="Bedrijfsnaam (optioneel)">
              <TextInput value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </Field>
            <Field label="Telefoonnummer (optioneel)">
              <TextInput
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setDuplicate(null);
                }}
              />
            </Field>
            <Field label="Interne notities">
              <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>

            {duplicate && (
              <div className="flex items-start gap-2.5 rounded-brand-sm border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-800">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <div>
                  <p className="font-semibold">Deze klant lijkt al te bestaan</p>
                  <p className="mt-0.5">
                    <Link href={`/dashboard/klanten/${duplicate.id}`} className="underline hover:no-underline" target="_blank">
                      {duplicate.name}
                      {duplicate.companyName ? ` (${duplicate.companyName})` : ""}
                    </Link>{" "}
                    heeft hetzelfde e-mailadres of telefoonnummer. Klik nogmaals op &quot;Klant aanmaken&quot; om
                    toch een nieuwe klant aan te maken.
                  </p>
                </div>
              </div>
            )}

            <Button type="submit" disabled={pending || checking || !name || !email} className="mt-2">
              {checking ? "Even checken…" : pending ? "Bezig…" : duplicate ? "Toch aanmaken" : "Klant aanmaken"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
