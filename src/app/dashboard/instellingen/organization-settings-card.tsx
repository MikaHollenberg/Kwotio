"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
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
  updatePublicPageBackgroundStyle,
  updateLocationSection,
  type OrganizationSettingsFields,
} from "./actions";
import type { PublicPageBackgroundStyle } from "@/lib/types/database";

const BACKGROUND_STYLE_OPTIONS: { value: PublicPageBackgroundStyle; label: string }[] = [
  { value: "none", label: "Geen" },
  { value: "coastline", label: "Kustlijn" },
  { value: "icons", label: "Iconen" },
];

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
  initialBackgroundStyle,
  initialLocationPhotoUrl,
  initialLocationCaption,
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
  initialBackgroundStyle: PublicPageBackgroundStyle;
  initialLocationPhotoUrl: string | null;
  initialLocationCaption: string | null;
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
  const [showQrPreview, setShowQrPreview] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState(initialWelcomeMessage);
  const [welcomeSaved, setWelcomeSaved] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [embedFallback, setEmbedFallback] = useState<string | null>(null);
  const [welcomePending, startWelcomeTransition] = useTransition();
  const [guestCountActive, setGuestCountActive] = useState(initialGuestCountActive);
  const [guestCountLabel, setGuestCountLabel] = useState(initialGuestCountLabel);
  const [guestCountSaved, setGuestCountSaved] = useState(false);
  const [guestCountPending, startGuestCountTransition] = useTransition();
  const [backgroundStyle, setBackgroundStyle] = useState(initialBackgroundStyle);
  const [backgroundStylePending, startBackgroundStyleTransition] = useTransition();
  const [locationPhotoUrl, setLocationPhotoUrl] = useState(initialLocationPhotoUrl ?? "");
  const [locationCaption, setLocationCaption] = useState(initialLocationCaption ?? "");
  const [locationSaved, setLocationSaved] = useState(false);
  const [locationPending, startLocationTransition] = useTransition();

  function saveLocation(next: { photoUrl: string; caption: string }) {
    setLocationSaved(false);
    startLocationTransition(async () => {
      await updateLocationSection(next);
      setLocationSaved(true);
    });
  }
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
      <Card data-faq-id="settings-organisatie">
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
    <Card data-faq-id="settings-organisatie">
      <CardHeader>
        <div>
          <CardTitle>Organisatie</CardTitle>
          <CardDescription>Bedrijfsgegevens gebruikt op offertes, PDF&apos;s en e-mails.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2" data-faq-id="settings-logo-upload">
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

        <div className="flex flex-col gap-4 border-t border-ink-100 pt-4" data-faq-id="settings-public-link">
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
              <button
                type="button"
                onClick={() => setShowQrPreview((v) => !v)}
                className="inline-flex h-9 items-center rounded-brand-sm border border-ink-200 px-3 text-sm font-medium text-ink-500 hover:bg-sand-100"
              >
                {showQrPreview ? "Verberg QR-code" : "Bekijk QR-code"}
              </button>
            )}
            {publicSlug && (
              <a
                href={`/api/public-page-qr?slug=${encodeURIComponent(publicSlug)}`}
                className="inline-flex h-9 items-center rounded-brand-sm border border-ink-200 px-3 text-sm font-medium text-ink-500 hover:bg-sand-100"
              >
                QR-code downloaden
              </a>
            )}
            {publicSlug && showQrPreview && (
              // "Materialiseert" bij openen i.p.v. meteen kaal te verschijnen
              // (Kwotio Motion Concepts #16) -- key=publicSlug zorgt dat de
              // animatie opnieuw speelt als de link ondertussen gewijzigd is.
              <div className="w-full basis-full">
                <Image
                  key={publicSlug}
                  src={`/api/public-page-qr?slug=${encodeURIComponent(publicSlug)}`}
                  alt="QR-code naar je publieke offertepagina"
                  width={160}
                  height={160}
                  unoptimized
                  className="kw-materialize rounded-brand-sm border border-ink-200 bg-white p-2"
                />
              </div>
            )}
            {publicSlug && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const snippet = [
                    `<iframe`,
                    `  id="kwotio-widget"`,
                    `  src="${publicPageOrigin}/embed/${publicSlug}"`,
                    `  style="width:100%;border:0;"`,
                    `  loading="lazy"`,
                    `></iframe>`,
                    `<script src="${publicPageOrigin}/embed.js" async></script>`,
                  ].join("\n");
                  // navigator.clipboard.writeText kan geweigerd worden door de
                  // browser (bv. geen HTTPS, restrictieve instellingen) --
                  // zonder fallback deed de knop dan stilzwijgend niets.
                  navigator.clipboard
                    .writeText(snippet)
                    .then(() => {
                      setEmbedCopied(true);
                      setTimeout(() => setEmbedCopied(false), 2000);
                    })
                    .catch(() => setEmbedFallback(snippet));
                }}
              >
                {embedCopied ? "Gekopieerd!" : "Embed-code kopiëren"}
              </Button>
            )}
          </div>
          <p className="text-xs text-ink-400">
            De embed-code plak je op je eigen website — het aanvraagformulier verschijnt dan direct
            daar, zonder dat een bezoeker naar deze Kwotio-link hoeft door te klikken.
          </p>
          {embedFallback && (
            <label className={labelClass}>
              Automatisch kopiëren lukte niet — selecteer en kopieer dit handmatig (Cmd/Ctrl+C):
              <textarea
                readOnly
                autoFocus
                value={embedFallback}
                onFocus={(e) => e.currentTarget.select()}
                rows={7}
                className={cn(inputClass, "font-mono text-xs")}
              />
            </label>
          )}
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

          <div className="flex flex-col gap-2 border-t border-ink-100 pt-4">
            <span className="text-xs font-semibold text-ink-400">
              Vrolijke achtergrond — een decoratieve stijl op de achtergrond van deze pagina. Staat
              standaard uit.
            </span>
            <div className="inline-flex w-fit rounded-brand-sm border border-ink-200/60 bg-white p-0.5 text-xs font-medium">
              {BACKGROUND_STYLE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setBackgroundStyle(option.value);
                    startBackgroundStyleTransition(async () => {
                      await updatePublicPageBackgroundStyle(option.value);
                    });
                  }}
                  className={cn(
                    "rounded-[calc(var(--radius-brand-sm)_-_2px)] px-3 py-1.5 transition-colors",
                    backgroundStyle === option.value ? "bg-teal-500 text-white" : "text-ink-400 hover:text-ink-500",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-ink-400">
              {backgroundStyle === "coastline" && "Een subtiele lijn-illustratie (horizon, bootjes, zonnetje) onderaan de pagina."}
              {backgroundStyle === "icons" && "Grote, speelse iconen (zon, cocktail, bbq, zeilboot) verspreid over de pagina."}
              {backgroundStyle === "none" && "Geen decoratieve achtergrond — de pagina blijft zoals hij nu is."}
            </p>
            {backgroundStylePending && <span className="text-sm text-ink-400">Bezig met opslaan…</span>}
          </div>

          <div className="flex flex-col gap-2 border-t border-ink-100 pt-4">
            <span className="text-xs font-semibold text-ink-400">
              Locatiefoto — een foto van jullie locatie, onderaan de publieke offertepagina. Leeg
              laten toont geen locatiesectie.
            </span>
            <div className="max-w-sm">
              <ImageUploadField
                label="Locatiefoto"
                aspect="aspect-video"
                organizationId={organizationId}
                value={locationPhotoUrl}
                onChange={(url) => {
                  setLocationPhotoUrl(url);
                  saveLocation({ photoUrl: url, caption: locationCaption });
                }}
              />
            </div>
            <label className={labelClass}>
              Onderschrift (optioneel) — bijv. &quot;Aan het water, direct bereikbaar per boot of over
              de kade&quot;. Het adres uit de bedrijfsgegevens hieronder wordt er automatisch bij getoond.
              <input
                value={locationCaption}
                onChange={(e) => {
                  setLocationCaption(e.target.value);
                  setLocationSaved(false);
                }}
                onBlur={() => saveLocation({ photoUrl: locationPhotoUrl, caption: locationCaption })}
                placeholder="Aan het water, direct bereikbaar per boot of over de kade"
                className={inputClass}
              />
            </label>
            {locationPending && <p className="text-xs text-ink-400">Bezig met opslaan…</p>}
            {locationSaved && !locationPending && <p className="text-xs text-emerald-600">Opgeslagen.</p>}
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
              Huisstijlkleuren — de primaire kleur wordt gebruikt op de offertepagina en in de offerte-PDF die de
              klant ziet (knoppen, voortgangsbalk, links). De secundaire kleur is nog niet in gebruik.
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
