"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImageUploadField } from "@/components/builder/image-upload-field";
import { PdfUploadField } from "@/components/builder/pdf-upload-field";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import type { LogoPreference } from "@/lib/types/database";
import {
  updateOrganizationSettings,
  updateOrganizationLogo,
  updateLogoPreference,
  updateOrganizationTerms,
  updateReviewUrl,
  updatePublicSlug,
  updatePublicWelcomeMessage,
  updateGuestCountFieldSettings,
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
  initialTermsUrl,
  initialReviewUrl,
  initialPublicSlug,
  initialWelcomeMessage,
  initialGuestCountActive,
  initialGuestCountLabel,
  publicPageOrigin,
  canEdit,
}: {
  organizationId: string;
  initial: OrganizationSettingsFields;
  initialLogoHorizontalUrl: string | null;
  initialLogoSquareUrl: string | null;
  initialLogoPreference: LogoPreference;
  initialTermsUrl: string | null;
  initialReviewUrl: string | null;
  initialPublicSlug: string;
  initialWelcomeMessage: string;
  initialGuestCountActive: boolean;
  initialGuestCountLabel: string;
  /** Origin (bijv. https://kwotio.vercel.app) voor de volledige publieke link. */
  publicPageOrigin: string;
  canEdit: boolean;
}) {
  const [fields, setFields] = useState(initial);
  const [logoHorizontalUrl, setLogoHorizontalUrl] = useState(initialLogoHorizontalUrl);
  const [logoSquareUrl, setLogoSquareUrl] = useState(initialLogoSquareUrl);
  const [logoPreference, setLogoPreference] = useState(initialLogoPreference);
  const [termsUrl, setTermsUrl] = useState(initialTermsUrl);
  const [reviewUrl, setReviewUrl] = useState(initialReviewUrl ?? "");
  const [reviewUrlSaved, setReviewUrlSaved] = useState(false);
  const [reviewUrlPending, startReviewUrlTransition] = useTransition();
  const [publicSlug, setPublicSlug] = useState(initialPublicSlug);
  const [slugSaved, setSlugSaved] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [slugPending, startSlugTransition] = useTransition();
  const [welcomeMessage, setWelcomeMessage] = useState(initialWelcomeMessage);
  const [welcomeSaved, setWelcomeSaved] = useState(false);
  const [welcomePending, startWelcomeTransition] = useTransition();
  const [guestCountActive, setGuestCountActive] = useState(initialGuestCountActive);
  const [guestCountLabel, setGuestCountLabel] = useState(initialGuestCountLabel);
  const [guestCountSaved, setGuestCountSaved] = useState(false);
  const [guestCountPending, startGuestCountTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function saveGuestCount(next: { active: boolean; label: string }) {
    setGuestCountSaved(false);
    startGuestCountTransition(async () => {
      await updateGuestCountFieldSettings(next);
      setGuestCountSaved(true);
    });
  }

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
            <div>
              <dt className="text-ink-400">Algemene voorwaarden</dt>
              <dd className="font-medium text-ink-500">
                {termsUrl ? (
                  <a href={termsUrl} target="_blank" rel="noopener noreferrer" className="text-teal-600 underline hover:text-teal-700">
                    Bekijk PDF
                  </a>
                ) : (
                  "Nog geen algemene voorwaarden geüpload"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-ink-400">Publieke offertepagina</dt>
              <dd className="font-medium text-ink-500">{publicPageOrigin}/offertes/{publicSlug}</dd>
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

        <div className="flex flex-col gap-2 border-t border-ink-100 pt-4">
          <span className="text-xs font-semibold text-ink-400">
            Algemene voorwaarden (PDF) — wordt op offertes, in de PDF en in e-mails gelinkt als
            &quot;algemene voorwaarden van {fields.brandName || "uw organisatie"}&quot;
          </span>
          {!termsUrl && (
            <p className="text-xs text-ink-400">
              Nog geen algemene voorwaarden geüpload. Zolang dit veld leeg is, wordt de verwijzing
              naar voorwaarden op offertes, in de PDF en in e-mails weggelaten.
            </p>
          )}
          <PdfUploadField
            label="Algemene voorwaarden"
            organizationId={organizationId}
            value={termsUrl ?? ""}
            onChange={(url) => {
              setTermsUrl(url || null);
              void updateOrganizationTerms(url);
            }}
          />
        </div>

        <div className="flex flex-col gap-2 border-t border-ink-100 pt-4">
          <span className="text-xs font-semibold text-ink-400">
            Review-link (optioneel) — bijv. je Google- of Facebook-reviewpagina. Wordt gebruikt in
            de automatische review-aanvraag-e-mail (Instellingen → E-mailautomatisering,
            &quot;dagen na evenementdatum&quot;).
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="url"
              value={reviewUrl}
              placeholder="https://g.page/r/.../review"
              onChange={(e) => {
                setReviewUrl(e.target.value);
                setReviewUrlSaved(false);
              }}
              className={cn(inputClass, "w-full max-w-md")}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={reviewUrlPending}
              onClick={() => {
                startReviewUrlTransition(async () => {
                  await updateReviewUrl(reviewUrl);
                  setReviewUrlSaved(true);
                });
              }}
            >
              {reviewUrlPending ? "Bezig…" : "Opslaan"}
            </Button>
            {reviewUrlSaved && !reviewUrlPending && <span className="text-sm text-emerald-600">Opgeslagen.</span>}
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-ink-100 pt-4">
          <div>
            <span className="text-xs font-semibold text-ink-400">Publieke offertepagina</span>
            <p className="mt-1 text-xs text-ink-400">
              De link waarop een klant zonder in te loggen jullie publiek zichtbaar gemaakte
              templates kan bekijken en een offerte kan aanvragen (per template aan te zetten in
              de templateredacteur).
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <label className={labelClass}>
              Link
              <div className="flex items-center gap-1 text-sm">
                <span className="whitespace-nowrap text-ink-300">{publicPageOrigin}/offertes/</span>
                <input
                  value={publicSlug}
                  onChange={(e) => {
                    setPublicSlug(e.target.value);
                    setSlugSaved(false);
                  }}
                  className={cn(inputClass, "w-40")}
                />
              </div>
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={slugPending}
              onClick={() => {
                setSlugError(null);
                setSlugSaved(false);
                startSlugTransition(async () => {
                  try {
                    await updatePublicSlug(publicSlug);
                    setSlugSaved(true);
                  } catch (err) {
                    setSlugError(err instanceof Error ? err.message : "Opslaan mislukt.");
                  }
                });
              }}
            >
              {slugPending ? "Bezig…" : "Link opslaan"}
            </Button>
            {slugSaved && !slugPending && <span className="text-sm text-emerald-600">Opgeslagen.</span>}
            {publicSlug && (
              <a
                href={`/api/public-page-qr?slug=${encodeURIComponent(publicSlug)}`}
                className="inline-flex h-9 items-center rounded-brand-sm border border-ink-200 px-3 text-sm font-medium text-ink-500 hover:bg-sand-100"
              >
                QR-code downloaden
              </a>
            )}
          </div>
          {slugError && <p className="text-sm text-red-600">{slugError}</p>}

          <label className={labelClass}>
            Welkomsttekst — bovenaan de publieke pagina, boven de disclaimer. Leeg laten toont geen
            welkomsttekst.
            <textarea
              rows={5}
              value={welcomeMessage}
              onChange={(e) => {
                setWelcomeMessage(e.target.value);
                setWelcomeSaved(false);
              }}
              onBlur={() => {
                setWelcomeSaved(false);
                startWelcomeTransition(async () => {
                  await updatePublicWelcomeMessage(welcomeMessage);
                  setWelcomeSaved(true);
                });
              }}
              placeholder={`Welkom op de offertepagina van ${fields.brandName || "uw organisatie"}! ...`}
              className="w-full rounded-brand-sm border border-ink-200 bg-white px-3 py-2 text-sm text-ink-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            />
          </label>
          {welcomePending && <p className="text-xs text-ink-400">Bezig met opslaan…</p>}
          {welcomeSaved && !welcomePending && <p className="text-xs text-emerald-600">Opgeslagen.</p>}

          <label className="flex items-center gap-2.5">
            <input
              type="checkbox"
              checked={guestCountActive}
              onChange={(e) => {
                const next = e.target.checked;
                setGuestCountActive(next);
                saveGuestCount({ active: next, label: guestCountLabel });
              }}
              className="size-4 accent-teal-600"
            />
            <span className="text-sm font-medium text-ink-500">
              Aantal-personen-veld tonen in het aanvraagformulier
            </span>
          </label>
          <label className={labelClass}>
            Label voor dit veld (bijv. &quot;Aantal personen&quot;, &quot;Aantal gasten&quot;, &quot;Groepsgrootte&quot;)
            <input
              value={guestCountLabel}
              disabled={!guestCountActive}
              onChange={(e) => setGuestCountLabel(e.target.value)}
              onBlur={() => saveGuestCount({ active: guestCountActive, label: guestCountLabel })}
              placeholder="Aantal personen"
              className={cn(inputClass, "disabled:opacity-60")}
            />
          </label>
          {guestCountSaved && !guestCountPending && <span className="text-sm text-emerald-600">Opgeslagen.</span>}
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
