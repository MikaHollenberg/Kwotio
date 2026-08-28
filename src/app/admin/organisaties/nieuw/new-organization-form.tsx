"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createOrganization, type OrganizationFields } from "../actions";

const inputClass =
  "h-10 rounded-brand-sm border border-ink-200 bg-white px-3 text-sm text-ink-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20";
const labelClass = "flex flex-col gap-1.5 text-xs font-semibold text-ink-400";

const EMPTY: OrganizationFields = {
  name: "",
  brandName: "",
  domain: "",
  kvkNumber: "",
  btwNumber: "",
  iban: "",
  contactEmail: "",
  contactPhone: "",
  address: { street: "", postalCode: "", city: "", country: "Nederland" },
  plan: "",
  monthlyPrice: 0,
  status: "proefperiode",
};

export function NewOrganizationForm() {
  const router = useRouter();
  const [fields, setFields] = useState<OrganizationFields>(EMPTY);
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ organizationId: string; tempPassword: string } | null>(null);

  function set<K extends keyof OrganizationFields>(key: K, value: OrganizationFields[K]) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  if (result) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-4">
          <h3 className="font-display text-lg font-semibold text-ink-500">Organisatie aangemaakt</h3>
          <p className="text-sm text-ink-400">
            Stuur onderstaande inloggegevens door naar de klant. Dit wachtwoord wordt hierna nergens meer getoond.
          </p>
          <div className="flex flex-col gap-2 rounded-brand-sm border border-ink-100 bg-sand-100 p-4">
            <p className="text-sm text-ink-500">
              <span className="font-semibold">E-mail:</span> {ownerEmail}
            </p>
            <p className="text-sm text-ink-500">
              <span className="font-semibold">Tijdelijk wachtwoord:</span>{" "}
              <span className="font-mono">{result.tempPassword}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => router.push(`/admin/organisaties/${result.organizationId}`)}>
              Naar organisatie
            </Button>
            <Button variant="outline" onClick={() => router.push("/admin/organisaties")}>
              Naar overzicht
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <form
          className="flex flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            startTransition(async () => {
              try {
                const created = await createOrganization(fields, { email: ownerEmail.trim(), fullName: ownerName.trim() });
                setResult(created);
              } catch {
                setError("Aanmaken mislukt. Controleer de velden (bestaat het e-mailadres al?).");
              }
            });
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              Bedrijfsnaam
              <input required value={fields.name} onChange={(e) => set("name", e.target.value)} className={inputClass} />
            </label>
            <label className={labelClass}>
              Merknaam (klantportaal)
              <input
                required
                value={fields.brandName}
                onChange={(e) => set("brandName", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              Domein
              <input value={fields.domain} onChange={(e) => set("domain", e.target.value)} className={inputClass} />
            </label>
            <label className={labelClass}>
              KvK-nummer
              <input value={fields.kvkNumber} onChange={(e) => set("kvkNumber", e.target.value)} className={inputClass} />
            </label>
            <label className={labelClass}>
              Btw-nummer
              <input value={fields.btwNumber} onChange={(e) => set("btwNumber", e.target.value)} className={inputClass} />
            </label>
            <label className={labelClass}>
              IBAN
              <input value={fields.iban} onChange={(e) => set("iban", e.target.value)} className={inputClass} />
            </label>
            <label className={labelClass}>
              Contact e-mail
              <input
                type="email"
                value={fields.contactEmail}
                onChange={(e) => set("contactEmail", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              Contact telefoon
              <input value={fields.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} className={inputClass} />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className={labelClass}>
              Straat + huisnummer
              <input
                value={fields.address.street}
                onChange={(e) => set("address", { ...fields.address, street: e.target.value })}
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              Postcode
              <input
                value={fields.address.postalCode}
                onChange={(e) => set("address", { ...fields.address, postalCode: e.target.value })}
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              Plaats
              <input
                value={fields.address.city}
                onChange={(e) => set("address", { ...fields.address, city: e.target.value })}
                className={inputClass}
              />
            </label>
          </div>

          <div className="grid gap-4 border-t border-ink-100 pt-4 sm:grid-cols-3">
            <label className={labelClass}>
              Plan
              <input
                placeholder="bijv. Starter"
                value={fields.plan}
                onChange={(e) => set("plan", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              Maandbedrag (€)
              <input
                type="number"
                min={0}
                step="0.01"
                value={fields.monthlyPrice}
                onChange={(e) => set("monthlyPrice", Number(e.target.value))}
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              Status
              <select
                value={fields.status}
                onChange={(e) => set("status", e.target.value as OrganizationFields["status"])}
                className={inputClass}
              >
                <option value="proefperiode">Proefperiode</option>
                <option value="actief">Actief</option>
                <option value="opgezegd">Opgezegd</option>
              </select>
            </label>
          </div>

          <div className="grid gap-4 border-t border-ink-100 pt-4 sm:grid-cols-2">
            <label className={labelClass}>
              Naam eigenaar
              <input required value={ownerName} onChange={(e) => setOwnerName(e.target.value)} className={inputClass} />
            </label>
            <label className={labelClass}>
              E-mail eigenaar
              <input
                type="email"
                required
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                className={inputClass}
              />
            </label>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" disabled={pending}>
            {pending ? "Bezig met aanmaken…" : "Organisatie aanmaken"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
