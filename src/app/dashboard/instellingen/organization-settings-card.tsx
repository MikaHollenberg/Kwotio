"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImageUploadField } from "@/components/builder/image-upload-field";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import type { LogoPreference } from "@/lib/types/database";
import {
  updateOrganizationSettings,
  updateOrganizationLogo,
  updateLogoPreference,
  type OrganizationSettingsFields,
} from "./actions";

const inputClass =
  "h-10 rounded-brand-sm border border-ink-200 bg-white px-3 text-sm text-ink-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20";
const labelClass = "flex flex-col gap-1.5 text-xs font-semibold text-ink-400";

export function OrganizationSettingsCard({
  organizationId,
  initial,
  initialLogoHorizontalUrl,
  initialLogoSquareUrl,
  initialLogoPreference,
  canEdit,
}: {
  organizationId: string;
  initial: OrganizationSettingsFields;
  initialLogoHorizontalUrl: string | null;
  initialLogoSquareUrl: string | null;
  initialLogoPreference: LogoPreference;
  canEdit: boolean;
}) {
  const [fields, setFields] = useState(initial);
  const [logoHorizontalUrl, setLogoHorizontalUrl] = useState(initialLogoHorizontalUrl);
  const [logoSquareUrl, setLogoSquareUrl] = useState(initialLogoSquareUrl);
  const [logoPreference, setLogoPreference] = useState(initialLogoPreference);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function set<K extends keyof OrganizationSettingsFields>(key: K, value: OrganizationSettingsFields[K]) {
    setSaved(false);
    setFields((f) => ({ ...f, [key]: value }));
  }

  if (!canEdit) {
    return (
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Organisatie</CardTitle>
            <CardDescription>Bedrijfsgegevens gebruikt op offertes, PDF&apos;s en e-mails.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-[auto_1fr]">
          <div className="flex items-center justify-center rounded-brand-sm bg-sand-200 p-6">
            {(logoPreference === "vierkant" ? logoSquareUrl : logoHorizontalUrl) ? (
              <Logo
                logoUrl={logoPreference === "vierkant" ? logoSquareUrl : logoHorizontalUrl}
                height={72}
              />
            ) : (
              <p className="text-xs text-ink-400">Geen logo ingesteld</p>
            )}
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt className="text-ink-400">Bedrijfsnaam</dt>
              <dd className="font-medium text-ink-500">{fields.name}</dd>
            </div>
            <div>
              <dt className="text-ink-400">Merknaam (klantportaal)</dt>
              <dd className="font-medium text-ink-500">{fields.brandName}</dd>
            </div>
            <div>
              <dt className="text-ink-400">Domein</dt>
              <dd className="font-medium text-ink-500">{fields.domain || "—"}</dd>
            </div>
            <div>
              <dt className="text-ink-400">KvK-nummer</dt>
              <dd className="font-medium text-ink-500">{fields.kvkNumber || "—"}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Organisatie</CardTitle>
          <CardDescription>Bedrijfsgegevens gebruikt op offertes, PDF&apos;s en e-mails.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-ink-400">Horizontaal logo (menubalk, langwerpig)</span>
              <ImageUploadField
                label="Horizontaal logo"
                aspect="aspect-[3/1]"
                organizationId={organizationId}
                fit="contain"
                value={logoHorizontalUrl ?? ""}
                onChange={(url) => {
                  setLogoHorizontalUrl(url || null);
                  void updateOrganizationLogo("horizontal", url);
                }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-ink-400">Vierkant logo</span>
              <ImageUploadField
                label="Vierkant logo"
                aspect="aspect-square"
                organizationId={organizationId}
                fit="contain"
                value={logoSquareUrl ?? ""}
                onChange={(url) => {
                  setLogoSquareUrl(url || null);
                  void updateOrganizationLogo("square", url);
                }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink-400">
              Hoofdlogo op offertes &amp; PDF&apos;s (de menubalk toont altijd het horizontale logo)
            </span>
            <div className="inline-flex w-fit rounded-brand-sm border border-ink-200/60 bg-white p-0.5 text-xs font-medium">
              {(["horizontaal", "vierkant"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setLogoPreference(option);
                    void updateLogoPreference(option);
                  }}
                  className={cn(
                    "rounded-[calc(var(--radius-brand-sm)_-_2px)] px-3 py-1.5 capitalize transition-colors",
                    logoPreference === option ? "bg-teal-500 text-white" : "text-ink-400 hover:text-ink-500",
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        <form
          className="flex flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            startTransition(async () => {
              try {
                await updateOrganizationSettings(fields);
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

          <div className="border-t border-ink-100 pt-4">
            <p className="mb-3 text-xs font-semibold text-ink-400">
              Huisstijlkleuren — nog niet toegepast op offertes/PDF&apos;s, alleen opgeslagen als voorbereiding.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelClass}>
                Primaire kleur
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={fields.brandTheme.primaryColor || "#2991B4"}
                    onChange={(e) => set("brandTheme", { ...fields.brandTheme, primaryColor: e.target.value })}
                    className="size-10 cursor-pointer rounded-brand-sm border border-ink-200 bg-white p-1"
                  />
                  <span className="text-xs text-ink-400">{fields.brandTheme.primaryColor || "#2991B4"}</span>
                </div>
              </label>
              <label className={labelClass}>
                Secundaire kleur
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={fields.brandTheme.secondaryColor || "#CC7A3E"}
                    onChange={(e) => set("brandTheme", { ...fields.brandTheme, secondaryColor: e.target.value })}
                    className="size-10 cursor-pointer rounded-brand-sm border border-ink-200 bg-white p-1"
                  />
                  <span className="text-xs text-ink-400">{fields.brandTheme.secondaryColor || "#CC7A3E"}</span>
                </div>
              </label>
            </div>
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
