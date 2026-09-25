"use client";

import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Archive, ArchiveRestore } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SegmentedToggle } from "@/components/ui/segmented-toggle";
import { DecimalField } from "@/components/ui/decimal-field";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ARRANGEMENT_COLOR_PRESETS } from "@/lib/arrangements/colors";
import { calculateArrangementPrice } from "@/lib/arrangements/pricing";
import type { ArrangementContentItem } from "@/lib/arrangements/types";
import { PdfUploadField } from "@/components/builder/pdf-upload-field";
import { ArrangementContentEditor } from "./content-editor";
import { cn } from "@/lib/utils";
import type { ArrangementPricingMode, PriceDisplayMode } from "@/lib/types/database";
import type { ArrangementBlockContent } from "@/lib/blocks/types";
import { BlockPreview } from "@/components/preview/quote-preview";
import type { Selections } from "@/lib/blocks/pricing";
import { LanguageProvider } from "@/lib/i18n/language-context";
import {
  createArrangement,
  updateArrangement,
  updatePriceTiers,
  updateSeasonPrices,
  archiveArrangement,
  unarchiveArrangement,
  deleteArrangement,
  type ArrangementFields,
} from "./actions";

type TierDraft = { key: string; minGuests: number; maxGuests: number | null; price: number };
type SeasonDraft = { key: string; label: string; startDate: string; endDate: string; price: number };

function makeKey() {
  return crypto.randomUUID();
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

const PRICING_MODE_OPTIONS: { value: ArrangementPricingMode; label: string }[] = [
  { value: "vast", label: "Vaste prijs" },
  { value: "staffel", label: "Staffelprijs" },
  { value: "seizoen", label: "Seizoensprijs" },
];

export function ArrangementForm({
  mode,
  arrangementId,
  organizationId,
  initial,
  initialTiers,
  initialSeasons,
  archivedAt,
}: {
  mode: "create" | "edit";
  arrangementId?: string;
  organizationId: string;
  initial: ArrangementFields;
  initialTiers: { minGuests: number; maxGuests: number | null; price: number }[];
  initialSeasons: { label: string; startDate: string; endDate: string; price: number }[];
  archivedAt?: string | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [category, setCategory] = useState(initial.category);
  const [colorCode, setColorCode] = useState(initial.colorCode);
  const [customColor, setCustomColor] = useState(!ARRANGEMENT_COLOR_PRESETS.includes(initial.colorCode as never));
  const [basePrice, setBasePrice] = useState(initial.basePrice);
  const [pricingMode, setPricingMode] = useState<ArrangementPricingMode>(initial.pricingMode);
  const [pricePerPerson, setPricePerPerson] = useState(initial.pricePerPerson);
  const [priceDisplay, setPriceDisplay] = useState<PriceDisplayMode>(initial.priceDisplay);
  const [isPubliclyVisible, setIsPubliclyVisible] = useState(initial.isPubliclyVisible);
  const [tiers, setTiers] = useState<TierDraft[]>(initialTiers.map((t) => ({ ...t, key: makeKey() })));
  const [seasons, setSeasons] = useState<SeasonDraft[]>(initialSeasons.map((s) => ({ ...s, key: makeKey() })));
  const [contentItems, setContentItems] = useState<ArrangementContentItem[]>(initial.contentItems);
  const [pdfUrl, setPdfUrl] = useState(initial.pdfUrl);
  // Vaste waarden i.p.v. instelbare velden -- de test-invoerbalk erboven de
  // live preview is op verzoek verwijderd; de staffel-/seizoensprijs-preview
  // rekent hier gewoon mee door op basis van deze aannames.
  const previewGuests = 10;
  const previewDate = todayIso();
  const [previewSelections, setPreviewSelections] = useState<Selections>({ packageIdByBlock: {}, addonQuantities: {} });
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);

  const preview = useMemo(
    () =>
      calculateArrangementPrice(
        { basePrice, pricingMode },
        tiers.map((t) => ({ id: t.key, minGuests: t.minGuests, maxGuests: t.maxGuests, price: t.price })),
        seasons.map((s) => ({ id: s.key, label: s.label, startDate: s.startDate, endDate: s.endDate, price: s.price })),
        { guestCount: previewGuests, eventDate: previewDate },
      ),
    [basePrice, pricingMode, tiers, seasons, previewGuests, previewDate],
  );

  // Zelfde momentopname-vorm als newBlockFromArrangement() bouwt zodra dit
  // arrangement echt aan een offerte wordt toegevoegd -- door dezelfde
  // BlockPreview te hergebruiken ziet de agency hier precies wat de klant
  // straks te zien krijgt, in plaats van alleen een los prijsgetal.
  const previewBlock = useMemo(
    () => ({
      id: "arrangement-preview",
      type: "arrangement" as const,
      position: 0,
      content: {
        heading: name || "Naam van het arrangement",
        arrangementId: arrangementId ?? "",
        name,
        description,
        colorCode,
        pricingMode,
        basePrice: preview.price,
        priceLabel: preview.appliedLabel,
        pricePerPerson,
        priceDisplay,
        contentItems,
        pdfUrl: pdfUrl.trim() || null,
      } satisfies ArrangementBlockContent,
    }),
    [name, arrangementId, description, colorCode, pricingMode, preview, pricePerPerson, priceDisplay, contentItems, pdfUrl],
  );
  // Laag prioriteit: het echte typen in Naam/Omschrijving/etc. mag nooit
  // wachten op het herrenderen van de (soms best zware) preview -- vooral
  // bij veel content-items kan dat anders voelbaar haperen tijdens typen.
  const deferredPreviewBlock = useDeferredValue(previewBlock);

  function addTier() {
    const last = tiers[tiers.length - 1];
    setTiers([...tiers, { key: makeKey(), minGuests: last ? (last.maxGuests ?? last.minGuests) + 1 : 1, maxGuests: null, price: last?.price ?? basePrice }]);
  }
  function addSeason() {
    setSeasons([...seasons, { key: makeKey(), label: "", startDate: todayIso(), endDate: todayIso(), price: basePrice }]);
  }

  function handleSave() {
    startTransition(async () => {
      const fields: ArrangementFields = {
        name,
        description,
        category,
        colorCode,
        basePrice,
        pricingMode,
        pricePerPerson,
        priceDisplay,
        isPubliclyVisible,
        contentItems,
        pdfUrl,
      };
      let id = arrangementId;
      if (mode === "create") {
        const result = await createArrangement(fields);
        id = result.id;
      } else {
        await updateArrangement(arrangementId!, fields);
      }
      if (pricingMode === "staffel") {
        await updatePriceTiers(id!, tiers.map((t) => ({ minGuests: t.minGuests, maxGuests: t.maxGuests, price: t.price })));
      } else if (pricingMode === "seizoen") {
        await updateSeasonPrices(id!, seasons.map((s) => ({ label: s.label, startDate: s.startDate, endDate: s.endDate, price: s.price })));
      }
      if (mode === "create") {
        router.push(`/dashboard/arrangementen/${id}`);
      } else {
        setSaved(true);
      }
    });
  }

  return (
    <div className="flex max-w-[1500px] flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/dashboard/arrangementen" className="mb-1 flex items-center gap-1 text-sm text-ink-400 hover:text-ink-500">
            <ArrowLeft className="size-3.5" /> Arrangementen
          </Link>
          <h2 className="font-display text-2xl font-semibold text-ink-500">
            {mode === "create" ? "Nieuw arrangement" : name || "Arrangement"}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm text-emerald-600">Opgeslagen.</span>}
          <Button onClick={handleSave} disabled={pending || !name.trim()}>
            {pending ? "Bezig…" : mode === "create" ? "Arrangement aanmaken" : "Opslaan"}
          </Button>
        </div>
      </div>

      {archivedAt && (
        <div className="rounded-brand-sm bg-sand-200 px-3.5 py-2.5 text-sm text-ink-500">
          Dit arrangement is gearchiveerd en staat niet meer in het overzicht.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_680px]">
      <div className="flex max-w-3xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Basisgegevens</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink-500">Naam</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Zeiltocht met schipper"
              className="h-11 rounded-brand-sm border border-ink-200 bg-white px-3.5 text-sm text-ink-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink-500">Omschrijving</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Een halve dag zeilen op het IJsselmeer, incl. schipper en koffie/thee."
              className="rounded-brand-sm border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isPubliclyVisible}
              onChange={(e) => setIsPubliclyVisible(e.target.checked)}
              className="size-4 accent-teal-600"
            />
            <span className="text-sm text-ink-500">Publiek zichtbaar op de offertepagina</span>
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink-500">Categorie (optioneel)</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Zeiltochten"
                className="h-11 rounded-brand-sm border border-ink-200 bg-white px-3.5 text-sm text-ink-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink-500">Kleurcode</label>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {ARRANGEMENT_COLOR_PRESETS.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => {
                      setColorCode(hex);
                      setCustomColor(false);
                    }}
                    aria-label={hex}
                    className={cn(
                      "size-7 rounded-full transition-transform duration-150 ease-brand hover:scale-110",
                      colorCode === hex && !customColor && "ring-2 ring-offset-2 ring-ink-400",
                    )}
                    style={{ backgroundColor: hex }}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => setCustomColor(true)}
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full border border-dashed border-ink-300 text-[10px] font-semibold text-ink-400 hover:border-ink-400",
                    customColor && "ring-2 ring-offset-2 ring-ink-400",
                  )}
                >
                  +
                </button>
                {customColor && (
                  <input
                    type="color"
                    value={colorCode}
                    onChange={(e) => setColorCode(e.target.value)}
                    className="size-7 cursor-pointer rounded-full border-0 bg-transparent"
                  />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prijsmodel</CardTitle>
          <CardDescription>Eén model per arrangement, zodat altijd duidelijk is welke prijs geldt.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <SegmentedToggle value={pricingMode} options={PRICING_MODE_OPTIONS} onChange={setPricingMode} />

          <div className="flex flex-wrap gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-ink-400">Weergave</label>
              <SegmentedToggle
                value={pricePerPerson ? "per_persoon" : "totaal"}
                onChange={(v) => setPricePerPerson(v === "per_persoon")}
                options={[
                  { value: "totaal", label: "Totaalprijs" },
                  { value: "per_persoon", label: "Per persoon" },
                ]}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-ink-400">Btw</label>
              <SegmentedToggle
                value={priceDisplay}
                onChange={setPriceDisplay}
                options={[
                  { value: "excl_btw", label: "Excl. btw" },
                  { value: "incl_btw", label: "Incl. btw" },
                ]}
              />
            </div>
          </div>

          {pricingMode === "vast" && (
            <div className="flex flex-col gap-1.5 sm:w-48">
              <label className="text-sm font-medium text-ink-500">Prijs</label>
              <DecimalField
                key={`base-${initial.basePrice}`}
                value={basePrice}
                onCommit={setBasePrice}
                className="h-11 rounded-brand-sm border border-ink-200 bg-white px-3.5 text-sm text-ink-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
          )}

          {pricingMode === "staffel" && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5 sm:w-48">
                <label className="text-sm font-medium text-ink-500">Basisprijs (terugval)</label>
                <DecimalField
                  key={`base-${initial.basePrice}`}
                  value={basePrice}
                  onCommit={setBasePrice}
                  className="h-11 rounded-brand-sm border border-ink-200 bg-white px-3.5 text-sm text-ink-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
              {tiers.map((tier) => (
                <div key={tier.key} className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={tier.minGuests}
                    onChange={(e) => setTiers(tiers.map((t) => (t.key === tier.key ? { ...t, minGuests: Number(e.target.value) } : t)))}
                    className="h-10 w-20 rounded-brand-sm border border-ink-200 bg-white px-2 text-center text-sm text-ink-500 outline-none focus:border-teal-500"
                  />
                  <span className="text-sm text-ink-400">tot</span>
                  <input
                    type="number"
                    min={tier.minGuests}
                    value={tier.maxGuests ?? ""}
                    placeholder="∞"
                    onChange={(e) =>
                      setTiers(tiers.map((t) => (t.key === tier.key ? { ...t, maxGuests: e.target.value === "" ? null : Number(e.target.value) } : t)))
                    }
                    className="h-10 w-20 rounded-brand-sm border border-ink-200 bg-white px-2 text-center text-sm text-ink-500 outline-none focus:border-teal-500"
                  />
                  <span className="text-sm text-ink-400">personen</span>
                  <DecimalField
                    value={tier.price}
                    onCommit={(v) => setTiers(tiers.map((t) => (t.key === tier.key ? { ...t, price: v } : t)))}
                    className="ml-auto h-10 w-28 rounded-brand-sm border border-ink-200 bg-white px-3 text-sm text-ink-500 outline-none focus:border-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => setTiers(tiers.filter((t) => t.key !== tier.key))}
                    className="flex size-8 items-center justify-center rounded-brand-sm text-ink-300 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addTier} className="w-fit">
                <Plus className="size-4" /> Staffel toevoegen
              </Button>
            </div>
          )}

          {pricingMode === "seizoen" && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5 sm:w-48">
                <label className="text-sm font-medium text-ink-500">Basisprijs (terugval)</label>
                <DecimalField
                  key={`base-${initial.basePrice}`}
                  value={basePrice}
                  onCommit={setBasePrice}
                  className="h-11 rounded-brand-sm border border-ink-200 bg-white px-3.5 text-sm text-ink-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
              {seasons.map((season) => (
                <div key={season.key} className="flex flex-wrap items-center gap-2">
                  <input
                    value={season.label}
                    onChange={(e) => setSeasons(seasons.map((s) => (s.key === season.key ? { ...s, label: e.target.value } : s)))}
                    placeholder="Hoogseizoen"
                    className="h-10 w-32 rounded-brand-sm border border-ink-200 bg-white px-2.5 text-sm text-ink-500 outline-none focus:border-teal-500"
                  />
                  <input
                    type="date"
                    value={season.startDate}
                    onChange={(e) => setSeasons(seasons.map((s) => (s.key === season.key ? { ...s, startDate: e.target.value } : s)))}
                    className="h-10 rounded-brand-sm border border-ink-200 bg-white px-2.5 text-sm text-ink-500 outline-none focus:border-teal-500"
                  />
                  <span className="text-sm text-ink-400">t/m</span>
                  <input
                    type="date"
                    value={season.endDate}
                    onChange={(e) => setSeasons(seasons.map((s) => (s.key === season.key ? { ...s, endDate: e.target.value } : s)))}
                    className="h-10 rounded-brand-sm border border-ink-200 bg-white px-2.5 text-sm text-ink-500 outline-none focus:border-teal-500"
                  />
                  <DecimalField
                    value={season.price}
                    onCommit={(v) => setSeasons(seasons.map((s) => (s.key === season.key ? { ...s, price: v } : s)))}
                    className="ml-auto h-10 w-28 rounded-brand-sm border border-ink-200 bg-white px-3 text-sm text-ink-500 outline-none focus:border-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => setSeasons(seasons.filter((s) => s.key !== season.key))}
                    className="flex size-8 items-center justify-center rounded-brand-sm text-ink-300 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addSeason} className="w-fit">
                <Plus className="size-4" /> Periode toevoegen
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-faq-id="arrangement-content-editor">
        <CardHeader>
          <CardTitle>Inhoud &amp; indeling</CardTitle>
          <CardDescription>
            Vul hier de tekst, kleur en icoon per onderdeel in. Sleep de onderdelen daarna in de live preview
            hiernaast naar precies de plek en breedte die je wilt -- ook tussen of naast elkaar.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink-500">Menukaart of extra info (PDF, optioneel)</label>
            <PdfUploadField value={pdfUrl} onChange={setPdfUrl} organizationId={organizationId} label="PDF" />
          </div>
          <ArrangementContentEditor
            items={contentItems}
            onChange={setContentItems}
            defaultColor={colorCode}
            organizationId={organizationId}
          />
        </CardContent>
      </Card>

      {mode === "edit" && arrangementId && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Archiveren &amp; verwijderen</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              {archivedAt ? (
                <Button
                  variant="outline"
                  disabled={pending}
                  onClick={() => startTransition(async () => { await unarchiveArrangement(arrangementId); router.refresh(); })}
                >
                  <ArchiveRestore className="size-4" /> Herstellen
                </Button>
              ) : (
                <Button variant="outline" disabled={pending} onClick={() => setConfirmArchive(true)}>
                  <Archive className="size-4" /> Archiveren
                </Button>
              )}
              <Button variant="ghost" disabled={pending} className="text-red-600 hover:bg-red-50" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="size-4" /> Definitief verwijderen
              </Button>
            </CardContent>
          </Card>

          <ConfirmDialog
            open={confirmArchive}
            title="Arrangement archiveren"
            description={`"${name}" wordt uit het overzicht gehaald. De gegevens blijven bestaan.`}
            confirmLabel="Archiveren"
            pending={pending}
            onConfirm={() =>
              startTransition(async () => {
                await archiveArrangement(arrangementId);
                setConfirmArchive(false);
                router.push("/dashboard/arrangementen");
              })
            }
            onCancel={() => setConfirmArchive(false)}
          />
          <ConfirmDialog
            open={confirmDelete}
            title="Arrangement definitief verwijderen"
            description={`Weet je zeker dat je "${name}" definitief wilt verwijderen? Dit kan niet ongedaan gemaakt worden.`}
            confirmLabel="Definitief verwijderen"
            danger
            pending={pending}
            onConfirm={() =>
              startTransition(async () => {
                await deleteArrangement(arrangementId);
                setConfirmDelete(false);
                router.push("/dashboard/arrangementen");
              })
            }
            onCancel={() => setConfirmDelete(false)}
          />
        </>
      )}
      </div>

      <div className="xl:sticky xl:top-6 xl:self-start">
        <p className="mb-3 text-sm font-semibold text-ink-500">Live preview</p>
        <div className="max-h-[calc(100vh-160px)] overflow-y-auto rounded-brand-lg bg-sand-200 p-4">
          <div className="overflow-hidden rounded-brand-lg bg-white shadow-sm">
            <LanguageProvider initialLang="nl">
              <BlockPreview
                block={deferredPreviewBlock}
                meta={{
                  title: name,
                  clientName: "",
                  eventDate: previewDate || null,
                  currency: "EUR",
                  priceDisplay,
                  pricePerPerson,
                  discountAmount: 0,
                }}
                selections={previewSelections}
                onSelectionsChange={setPreviewSelections}
                readOnly={false}
                accentColor={colorCode}
                arrangementLayoutEditable
                onArrangementLayoutChange={(_blockId, items) => setContentItems(items)}
              />
            </LanguageProvider>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
