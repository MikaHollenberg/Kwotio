"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { updateOrganization, type OrganizationFields } from "../actions";

const inputClass =
  "h-10 rounded-brand-sm border border-ink-200 bg-white px-3 text-sm text-ink-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20";
const labelClass = "flex flex-col gap-1.5 text-xs font-semibold text-ink-400";

export function OrganizationEditForm({
  organizationId,
  initial,
}: {
  organizationId: string;
  initial: OrganizationFields;
}) {
  const [fields, setFields] = useState<OrganizationFields>(initial);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function set<K extends keyof OrganizationFields>(key: K, value: OrganizationFields[K]) {
    setSaved(false);
    setFields((f) => ({ ...f, [key]: value }));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organisatiegegevens</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            startTransition(async () => {
              try {
                await updateOrganization(organizationId, fields);
                setSaved(true);
              } catch {
                setError("Opslaan mislukt.");
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
              <input value={fields.plan} onChange={(e) => set("plan", e.target.value)} className={inputClass} />
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

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={pending}>
              {pending ? "Bezig met opslaan…" : "Opslaan"}
            </Button>
            {saved && <span className="text-sm text-emerald-600">Opgeslagen.</span>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
