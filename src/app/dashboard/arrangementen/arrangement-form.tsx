"use client";

import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowLeft, Plus, Trash2, Archive, ArchiveRestore, GripVertical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SegmentedToggle } from "@/components/ui/segmented-toggle";
import { DecimalField } from "@/components/ui/decimal-field";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ARRANGEMENT_COLOR_PRESETS } from "@/lib/arrangements/colors";
import { resolveArrangementPrices } from "@/lib/arrangements/pricing";
import type { ArrangementContentItem } from "@/lib/arrangements/types";
import { PdfUploadField } from "@/components/builder/pdf-upload-field";
import { ArrangementContentEditor } from "./content-editor";
import { cn } from "@/lib/utils";
import type { ArrangementPriceUnit, PriceDisplayMode } from "@/lib/types/database";
import type { ArrangementBlockContent } from "@/lib/blocks/types";
import { BlockPreview } from "@/components/preview/quote-preview";
import type { Selections } from "@/lib/blocks/pricing";
import { LanguageProvider } from "@/lib/i18n/language-context";
import {
  createArrangement,
  updateArrangement,
  updateArrangementPrices,
  updateArrangementSeasons,
  updateArrangementSurcharges,
  archiveArrangement,
  unarchiveArrangement,
  deleteArrangement,
  type ArrangementFields,
} from "./actions";

type PriceDraft = { key: string; label: string; unit: ArrangementPriceUnit; amount: number };
type SeasonDraft = { key: string; label: string; startDate: string; endDate: string; prices: PriceDraft[] };
type SurchargeDraft = { key: string; label: string; minGuests: number; maxGuests: number | null; unit: ArrangementPriceUnit; amount: number };

const UNIT_OPTIONS: { value: ArrangementPriceUnit; label: string }[] = [
  { value: "vast", label: "vast bedrag" },
  { value: "p.p.", label: "per persoon" },
];

function makeKey() {
  return crypto.randomUUID();
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function emptyPrice(): PriceDraft {
  return { key: makeKey(), label: "", unit: "vast", amount: 0 };
}

function SortablePriceRow({
  price,
  onChange,
  onRemove,
}: {
  price: PriceDraft;
  onChange: (price: PriceDraft) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: price.key });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("flex flex-wrap items-center gap-1.5", isDragging && "z-10 opacity-90")}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="flex size-8 shrink-0 cursor-grab items-center justify-center rounded-brand-sm text-ink-300 hover:bg-sand-200 hover:text-ink-500 active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </button>
      <input
        value={price.label}
        onChange={(e) => onChange({ ...price, label: e.target.value })}
        placeholder="Waarvoor, bv. Zaalhuur"
        className="h-9 flex-1 rounded-brand-sm border border-ink-200 bg-white px-2.5 text-sm text-ink-500 outline-none focus:border-teal-500"
      />
      <DecimalField
        value={price.amount}
        onCommit={(v) => onChange({ ...price, amount: v })}
        className="h-9 w-24 rounded-brand-sm border border-ink-200 bg-white px-2.5 text-sm text-ink-500 outline-none focus:border-teal-500"
      />
      <SegmentedToggle value={price.unit} options={UNIT_OPTIONS} onChange={(unit) => onChange({ ...price, unit })} />
      <button
        type="button"
        onClick={onRemove}
        className="flex size-8 items-center justify-center rounded-brand-sm text-ink-300 hover:bg-red-50 hover:text-red-600"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}

/** Rij-editor voor een lijst prijsregels (naam + bedrag + vast/p.p.-toggle +
 * sleephandvat + verwijderen) -- hergebruikt in zowel de "altijd actieve"
 * prijzenlijst als per seizoen, zelfde drag-patroon als de blokken-editor. */
function PriceLinesEditor({ prices, onChange }: { prices: PriceDraft[]; onChange: (prices: PriceDraft[]) => void }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = prices.findIndex((p) => p.key === active.id);
    const newIndex = prices.findIndex((p) => p.key === over.id);
    onChange(arrayMove(prices, oldIndex, newIndex));
  }

  return (
    <div className="flex flex-col gap-2">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={prices.map((p) => p.key)} strategy={verticalListSortingStrategy}>
          {prices.map((price) => (
            <SortablePriceRow
              key={price.key}
              price={price}
              onChange={(next) => onChange(prices.map((p) => (p.key === price.key ? next : p)))}
              onRemove={() => onChange(prices.filter((p) => p.key !== price.key))}
            />
          ))}
        </SortableContext>
      </DndContext>
      <Button variant="outline" size="sm" onClick={() => onChange([...prices, emptyPrice()])} className="w-fit">
        <Plus className="size-4" /> Prijs toevoegen
      </Button>
    </div>
  );
}

export function ArrangementForm({
  mode,
  arrangementId,
  organizationId,
  initial,
  initialPrices,
  initialSeasons,
  initialSurcharges,
  archivedAt,
}: {
  mode: "create" | "edit";
  arrangementId?: string;
  organizationId: string;
  initial: ArrangementFields;
  initialPrices: { label: string; unit: ArrangementPriceUnit; amount: number }[];
  initialSeasons: { label: string; startDate: string; endDate: string; prices: { label: string; unit: ArrangementPriceUnit; amount: number }[] }[];
  initialSurcharges: { label: string; minGuests: number; maxGuests: number | null; unit: ArrangementPriceUnit; amount: number }[];
  archivedAt?: string | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [publicDescription, setPublicDescription] = useState(initial.publicDescription);
  const [category, setCategory] = useState(initial.category);
  const [colorCode, setColorCode] = useState(initial.colorCode);
  const [customColor, setCustomColor] = useState(!ARRANGEMENT_COLOR_PRESETS.includes(initial.colorCode as never));
  const [priceDisplay, setPriceDisplay] = useState<PriceDisplayMode>(initial.priceDisplay);
  const [isPubliclyVisible, setIsPubliclyVisible] = useState(initial.isPubliclyVisible);
  const [prices, setPrices] = useState<PriceDraft[]>(initialPrices.map((p) => ({ ...p, key: makeKey() })));
  const [seasons, setSeasons] = useState<SeasonDraft[]>(
    initialSeasons.map((s) => ({ ...s, key: makeKey(), prices: s.prices.map((p) => ({ ...p, key: makeKey() })) })),
  );
  const [surcharges, setSurcharges] = useState<SurchargeDraft[]>(initialSurcharges.map((s) => ({ ...s, key: makeKey() })));
  const [contentItems, setContentItems] = useState<ArrangementContentItem[]>(initial.contentItems);
  const [pdfUrl, setPdfUrl] = useState(initial.pdfUrl);
  const previewDate = todayIso();
  const [previewSelections, setPreviewSelections] = useState<Selections>({ packageIdByBlock: {}, addonQuantities: {} });
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);

  const resolvedPreviewPrices = useMemo(
    () =>
      resolveArrangementPrices(
        prices.map((p) => ({ id: p.key, label: p.label, unit: p.unit, amount: p.amount })),
        seasons.map((s) => ({
          id: s.key,
          label: s.label,
          startDate: s.startDate,
          endDate: s.endDate,
          prices: s.prices.map((p) => ({ id: p.key, label: p.label, unit: p.unit, amount: p.amount })),
        })),
        previewDate,
      ),
    [prices, seasons, previewDate],
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
        prices: resolvedPreviewPrices.prices,
        seasonLabel: resolvedPreviewPrices.seasonLabel,
        surcharges: surcharges.map((s) => ({ id: s.key, label: s.label, minGuests: s.minGuests, maxGuests: s.maxGuests, unit: s.unit, amount: s.amount })),
        priceDisplay,
        contentItems,
        pdfUrl: pdfUrl.trim() || null,
      } satisfies ArrangementBlockContent,
    }),
    [name, arrangementId, description, colorCode, resolvedPreviewPrices, surcharges, priceDisplay, contentItems, pdfUrl],
  );
  // Laag prioriteit: het echte typen in Naam/Omschrijving/etc. mag nooit
  // wachten op het herrenderen van de (soms best zware) preview -- vooral
  // bij veel content-items kan dat anders voelbaar haperen tijdens typen.
  const deferredPreviewBlock = useDeferredValue(previewBlock);

  function addSeason() {
    setSeasons([...seasons, { key: makeKey(), label: "", startDate: todayIso(), endDate: todayIso(), prices: [emptyPrice()] }]);
  }
  function addSurcharge() {
    const last = surcharges[surcharges.length - 1];
    setSurcharges([
      ...surcharges,
      { key: makeKey(), label: "", minGuests: last ? (last.maxGuests ?? last.minGuests) + 1 : 1, maxGuests: null, unit: "p.p.", amount: 0 },
    ]);
  }

  function handleSave() {
    startTransition(async () => {
      const fields: ArrangementFields = {
        name,
        description,
        publicDescription,
        category,
        colorCode,
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
      await Promise.all([
        updateArrangementPrices(id!, prices.map((p) => ({ label: p.label, unit: p.unit, amount: p.amount }))),
        updateArrangementSeasons(
          id!,
          seasons.map((s) => ({
            label: s.label,
            startDate: s.startDate,
            endDate: s.endDate,
            prices: s.prices.map((p) => ({ label: p.label, unit: p.unit, amount: p.amount })),
          })),
        ),
        updateArrangementSurcharges(
          id!,
          surcharges.map((s) => ({ label: s.label, minGuests: s.minGuests, maxGuests: s.maxGuests, unit: s.unit, amount: s.amount })),
        ),
      ]);
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

          {isPubliclyVisible && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink-500">Tekst op de publieke pagina (optioneel)</label>
              <textarea
                value={publicDescription}
                onChange={(e) => setPublicDescription(e.target.value)}
                rows={2}
                placeholder="Een halve dag zeilen op het IJsselmeer, incl. schipper en koffie/thee."
                className="rounded-brand-sm border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
              <p className="text-xs text-ink-400">
                Getoond op de publieke offertepagina i.p.v. de omschrijving hierboven. Laat leeg om die omschrijving
                daar ook te gebruiken.
              </p>
            </div>
          )}

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
          <CardTitle>Prijzen</CardTitle>
          <CardDescription>
            Eén of meer losse prijsregels, elk met een eigen naam en vast bedrag of bedrag per persoon -- bv.
            &quot;Zaalhuur&quot; (vast) naast &quot;Drankarrangement&quot; (per persoon).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
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
          <PriceLinesEditor prices={prices} onChange={setPrices} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Seizoensprijzen</CardTitle>
          <CardDescription>
            Een periode met zijn eigen prijsregels, die de prijzen hierboven vervangen zodra de datum van de
            offerte binnen die periode valt.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {seasons.map((season) => (
            <div key={season.key} className="flex flex-col gap-2.5 rounded-brand-sm border border-ink-100 bg-sand-50 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={season.label}
                  onChange={(e) => setSeasons(seasons.map((s) => (s.key === season.key ? { ...s, label: e.target.value } : s)))}
                  placeholder="Hoogseizoen"
                  className="h-9 w-40 rounded-brand-sm border border-ink-200 bg-white px-2.5 text-sm text-ink-500 outline-none focus:border-teal-500"
                />
                <input
                  type="date"
                  value={season.startDate}
                  onChange={(e) => setSeasons(seasons.map((s) => (s.key === season.key ? { ...s, startDate: e.target.value } : s)))}
                  className="h-9 rounded-brand-sm border border-ink-200 bg-white px-2.5 text-sm text-ink-500 outline-none focus:border-teal-500"
                />
                <span className="text-sm text-ink-400">t/m</span>
                <input
                  type="date"
                  value={season.endDate}
                  onChange={(e) => setSeasons(seasons.map((s) => (s.key === season.key ? { ...s, endDate: e.target.value } : s)))}
                  className="h-9 rounded-brand-sm border border-ink-200 bg-white px-2.5 text-sm text-ink-500 outline-none focus:border-teal-500"
                />
                <button
                  type="button"
                  onClick={() => setSeasons(seasons.filter((s) => s.key !== season.key))}
                  className="ml-auto flex size-8 items-center justify-center rounded-brand-sm text-ink-300 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <PriceLinesEditor
                prices={season.prices}
                onChange={(next) => setSeasons(seasons.map((s) => (s.key === season.key ? { ...s, prices: next } : s)))}
              />
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addSeason} className="w-fit">
            <Plus className="size-4" /> Seizoen toevoegen
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Toeslagen</CardTitle>
          <CardDescription>
            Leesbare regels op basis van aantal personen, bv. &quot;40-50 personen: +€2,50 p.p.&quot; -- puur informatief,
            wordt getoond bij de prijzen maar nooit automatisch verrekend (het aantal personen is pas bij
            ondertekenen bekend).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {surcharges.map((s) => (
            <div key={s.key} className="flex flex-wrap items-center gap-1.5">
              <input
                value={s.label}
                onChange={(e) => setSurcharges(surcharges.map((x) => (x.key === s.key ? { ...x, label: e.target.value } : x)))}
                placeholder="Omschrijving (optioneel)"
                className="h-9 min-w-32 flex-1 rounded-brand-sm border border-ink-200 bg-white px-2.5 text-sm text-ink-500 outline-none focus:border-teal-500"
              />
              <input
                type="number"
                min={1}
                value={s.minGuests}
                onChange={(e) => setSurcharges(surcharges.map((x) => (x.key === s.key ? { ...x, minGuests: Number(e.target.value) } : x)))}
                className="h-9 w-20 rounded-brand-sm border border-ink-200 bg-white px-2 text-center text-sm text-ink-500 outline-none focus:border-teal-500"
              />
              <span className="text-sm text-ink-400">tot</span>
              <input
                type="number"
                min={s.minGuests}
                value={s.maxGuests ?? ""}
                placeholder="∞"
                onChange={(e) =>
                  setSurcharges(
                    surcharges.map((x) => (x.key === s.key ? { ...x, maxGuests: e.target.value === "" ? null : Number(e.target.value) } : x)),
                  )
                }
                className="h-9 w-20 rounded-brand-sm border border-ink-200 bg-white px-2 text-center text-sm text-ink-500 outline-none focus:border-teal-500"
              />
              <span className="text-sm text-ink-400">personen</span>
              <DecimalField
                value={s.amount}
                onCommit={(v) => setSurcharges(surcharges.map((x) => (x.key === s.key ? { ...x, amount: v } : x)))}
                className="h-9 w-24 rounded-brand-sm border border-ink-200 bg-white px-2.5 text-sm text-ink-500 outline-none focus:border-teal-500"
              />
              <SegmentedToggle
                value={s.unit}
                options={UNIT_OPTIONS}
                onChange={(unit) => setSurcharges(surcharges.map((x) => (x.key === s.key ? { ...x, unit } : x)))}
              />
              <button
                type="button"
                onClick={() => setSurcharges(surcharges.filter((x) => x.key !== s.key))}
                className="flex size-8 items-center justify-center rounded-brand-sm text-ink-300 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addSurcharge} className="w-fit">
            <Plus className="size-4" /> Toeslag toevoegen
          </Button>
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
                  pricePerPerson: false,
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
