"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ImageUploadField } from "@/components/builder/image-upload-field";
import { cn } from "@/lib/utils";
import type { PublicPageBackgroundStyle } from "@/lib/types/database";
import {
  updatePublicSlug,
  updatePublicWelcomeMessage,
  updateGuestCountFieldSettings,
  updatePublicPageBackgroundStyle,
  updateLocationSection,
} from "./actions";

const inputClass =
  "h-10 rounded-brand-sm border border-ink-200 bg-white px-3 text-sm text-ink-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 disabled:opacity-60";
const labelClass = "flex flex-col gap-1.5 text-xs font-semibold text-ink-400";

const BACKGROUND_STYLE_OPTIONS: { value: PublicPageBackgroundStyle; label: string }[] = [
  { value: "none", label: "Geen" },
  { value: "coastline", label: "Kustlijn" },
  { value: "icons", label: "Iconen" },
];

/** "Publieke offertepagina"-categorie op Instellingen: alles wat bepaalt
 * hoe /offertes/[slug] eruitziet en werkt voor een klant zonder in te
 * loggen. Uitgesplitst uit `OrganizationSettingsCard` bij het Instellingen-
 * herontwerp (die kaart was met bedrijfsgegevens én publieke-pagina-velden
 * samen te druk geworden). */
export function PublicPageSettingsCard({
  initialPublicSlug,
  initialWelcomeMessage,
  initialGuestCountActive,
  initialGuestCountLabel,
  initialBackgroundStyle,
  initialLocationPhotoUrl,
  initialLocationCaption,
  organizationId,
  brandName,
  publicPageOrigin,
  canEdit,
}: {
  initialPublicSlug: string;
  initialWelcomeMessage: string;
  initialGuestCountActive: boolean;
  initialGuestCountLabel: string;
  initialBackgroundStyle: PublicPageBackgroundStyle;
  initialLocationPhotoUrl: string | null;
  initialLocationCaption: string | null;
  organizationId: string;
  /** Voor de placeholder-tekst van de welkomsttekst ("Welkom op de
   * offertepagina van {brandName}!"). */
  brandName: string;
  /** Origin (bijv. https://kwotio.vercel.app) voor de volledige publieke link. */
  publicPageOrigin: string;
  canEdit: boolean;
}) {
  const [publicSlug, setPublicSlug] = useState(initialPublicSlug);
  const [slugSaved, setSlugSaved] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [slugPending, startSlugTransition] = useTransition();
  const [showQrPreview, setShowQrPreview] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [embedFallback, setEmbedFallback] = useState<string | null>(null);
  const [welcomeMessage, setWelcomeMessage] = useState(initialWelcomeMessage);
  const [welcomeSaved, setWelcomeSaved] = useState(false);
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

  function saveGuestCount(next: { active: boolean; label: string }) {
    setGuestCountSaved(false);
    startGuestCountTransition(async () => {
      await updateGuestCountFieldSettings(next);
      setGuestCountSaved(true);
    });
  }

  if (!canEdit) {
    return (
      <dl className="text-sm">
        <dt className="text-ink-400">Publieke offertepagina</dt>
        <dd className="font-medium text-ink-500">
          {publicPageOrigin}/offertes/{publicSlug}
        </dd>
      </dl>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div data-faq-id="settings-public-link">
        <span className="text-xs font-semibold text-ink-400">Publieke link</span>
        <p className="mt-1 text-xs text-ink-400">
          De link waarop een klant zonder in te loggen jullie publiek zichtbaar gemaakte templates
          kan bekijken en een offerte kan aanvragen (per template aan te zetten in de
          templateredacteur).
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
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
        <p className="mt-2 text-xs text-ink-400">
          De embed-code plak je op je eigen website — het aanvraagformulier verschijnt dan direct
          daar, zonder dat een bezoeker naar deze Kwotio-link hoeft door te klikken.
        </p>
        {embedFallback && (
          <label className={cn(labelClass, "mt-2")}>
            Automatisch kopiëren lukte niet — selecteer en kopieer dit handmatig (Cmd/Ctrl+C):
            <textarea
              readOnly
              autoFocus
              value={embedFallback}
              onFocus={(e) => e.currentTarget.select()}
              rows={7}
              className={cn(inputClass, "h-auto font-mono text-xs")}
            />
          </label>
        )}
        {slugError && <p className="mt-2 text-sm text-red-600">{slugError}</p>}
      </div>

      <label className={cn(labelClass, "border-t border-ink-100 pt-4")}>
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
          placeholder={`Welkom op de offertepagina van ${brandName || "uw organisatie"}! ...`}
          className="w-full rounded-brand-sm border border-ink-200 bg-white px-3 py-2 text-sm text-ink-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        />
      </label>
      {welcomePending && <p className="text-xs text-ink-400">Bezig met opslaan…</p>}
      {welcomeSaved && !welcomePending && <p className="text-xs text-emerald-600">Opgeslagen.</p>}

      <div className="border-t border-ink-100 pt-4">
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
        <label className={cn(labelClass, "mt-3")}>
          Label voor dit veld (bijv. &quot;Aantal personen&quot;, &quot;Aantal gasten&quot;, &quot;Groepsgrootte&quot;)
          <input
            value={guestCountLabel}
            disabled={!guestCountActive}
            onChange={(e) => setGuestCountLabel(e.target.value)}
            onBlur={() => saveGuestCount({ active: guestCountActive, label: guestCountLabel })}
            placeholder="Aantal personen"
            className={inputClass}
          />
        </label>
        {guestCountSaved && !guestCountPending && <span className="mt-1 text-sm text-emerald-600">Opgeslagen.</span>}
      </div>

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
          Locatiefoto — een foto van jullie locatie, onderaan de publieke offertepagina. Leeg laten
          toont geen locatiesectie.
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
          Onderschrift (optioneel) — bijv. &quot;Aan het water, direct bereikbaar per boot of over de
          kade&quot;. Het adres uit de bedrijfsgegevens wordt er automatisch bij getoond.
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
  );
}
