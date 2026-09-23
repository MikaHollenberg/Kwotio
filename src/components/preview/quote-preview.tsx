"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, FileText, Star, Image as ImageIcon, X } from "lucide-react";
import type { BlockDraft } from "@/lib/blocks/types";
import type {
  CoverBlockContent,
  TextBlockContent,
  GalleryBlockContent,
  PackagesBlockContent,
  TimelineBlockContent,
  SignatureBlockContent,
  ArrangementBlockContent,
} from "@/lib/blocks/types";
import { calculateTotal, type Selections } from "@/lib/blocks/pricing";
import { PRICE_DISPLAY_LABELS } from "@/lib/blocks/price-display";
import { useQuoteSelections } from "@/hooks/use-quote-selections";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { WaveDivider } from "@/components/brand/wave-divider";
import { QuoteHeaderSection, type QuoteHeaderData } from "@/components/preview/quote-header";
import { AnimatedPrice } from "@/components/preview/animated-price";
import { SunWatermark } from "@/components/brand/sun-watermark";
import { Button } from "@/components/ui/button";
import type { PriceDisplayMode } from "@/lib/types/database";
import { LanguageProvider, useTranslation } from "@/lib/i18n/language-context";
import { sanitizeBlockHtml } from "@/lib/blocks/sanitize-html";
import { ARRANGEMENT_ICON_MAP } from "@/lib/arrangements/icons";

export { PRICE_DISPLAY_LABELS };

/** Teal-600 -- het bestaande vaste accent in de bureau-builder/dashboard
 * (nooit org-gebrand, zie architectuurnotitie hierboven). Alleen de
 * klant-facing offertepagina en de publieke aanvraagpagina geven hun eigen
 * `organizations.brand_theme.primaryColor` door via de `accentColor`-prop. */
const DEFAULT_BLOCK_ACCENT = "#0d9488";

export type QuoteMeta = {
  title: string;
  clientName: string;
  eventDate: string | null;
  currency: string;
  priceDisplay: PriceDisplayMode;
  discountAmount: number;
  pricePerPerson: boolean;
};

/** "€ 45,00" of "€ 45,00 p.p." — puur een label-wissel, geen rekensom: het
 * aantal personen is pas bekend zodra de klant tekent (feature 2), dus er
 * kan tijdens het bekijken/kiezen van de offerte niks gedeeld worden. */
function priceLabel(amount: number, currency: string, pricePerPerson: boolean) {
  return `${formatCurrency(amount, currency)}${pricePerPerson ? " p.p." : ""}`;
}

export function QuotePreview({
  blocks,
  meta,
  mode = "desktop",
  headerData,
}: {
  blocks: BlockDraft[];
  meta: QuoteMeta;
  mode?: "desktop" | "mobile";
  headerData?: QuoteHeaderData;
}) {
  // De builder-preview is altijd Nederlands — de taalwisselaar zelf is
  // uitsluitend voor de klant-facing offertepagina (sectie 3.10).
  return (
    <LanguageProvider initialLang="nl">
      <QuotePreviewInner blocks={blocks} meta={meta} mode={mode} headerData={headerData} />
    </LanguageProvider>
  );
}

function QuotePreviewInner({
  blocks,
  meta,
  mode,
  headerData,
}: {
  blocks: BlockDraft[];
  meta: QuoteMeta;
  mode: "desktop" | "mobile";
  headerData?: QuoteHeaderData;
}) {
  const { hasPricedBlocks, selections, setSelections, subtotal } = useQuoteSelections(blocks);
  const total = calculateTotal({ subtotal, discountAmount: meta.discountAmount });
  const { t } = useTranslation();

  const sorted = [...blocks].sort((a, b) => a.position - b.position);

  return (
    <div
      className={cn(
        "mx-auto overflow-hidden rounded-brand-lg border border-ink-200/60 bg-white shadow-sm",
        mode === "mobile" ? "max-w-[390px]" : "w-full",
      )}
    >
      <div className="font-sans text-ink-500">
        {headerData && <QuoteHeaderSection data={headerData} />}
        {sorted.map((block, i) => (
          <div key={block.id}>
            {i > 0 && (
              <div className="px-6">
                <WaveDivider className="text-blue-200" />
              </div>
            )}
            <BlockPreview
              block={block}
              meta={meta}
              selections={selections}
              onSelectionsChange={setSelections}
            />
          </div>
        ))}

        {hasPricedBlocks && (
          <div className="sticky bottom-0 flex items-center justify-between gap-4 border-t border-ink-100 bg-white/95 px-6 py-4 backdrop-blur-sm">
            <div>
              <p className="text-xs text-ink-400">
                {t("total_label")}
                {meta.pricePerPerson ? " p.p." : ""} ({t(meta.priceDisplay === "incl_btw" ? "price_incl_btw" : "price_excl_btw")})
              </p>
              <p className="font-display text-xl font-semibold text-ink-500">
                <AnimatedPrice amount={total} currency={meta.currency} />
                {meta.pricePerPerson ? " p.p." : ""}
              </p>
            </div>
            <Button size={mode === "mobile" ? "sm" : "md"}>{t("accept_and_sign")}</Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-2xl font-semibold text-ink-500">{children}</h2>
  );
}

export function BlockPreview({
  block,
  meta,
  selections,
  onSelectionsChange,
  readOnly = false,
  accentColor = DEFAULT_BLOCK_ACCENT,
}: {
  block: BlockDraft;
  meta: QuoteMeta;
  selections: Selections;
  onSelectionsChange: (s: Selections) => void;
  /** Publieke templatepreview (/offertes/[slug]): niets is aanklikbaar en er
   * is geen echte quote/handtekening achter deze weergave. */
  readOnly?: boolean;
  /** Organisatie-huisstijlkleur voor klant-facing plekken (offertepagina,
   * publieke aanvraagpagina) -- valt terug op het vaste bureau-teal in de
   * dashboard-builder, die nooit org-gebrand is. */
  accentColor?: string;
}) {
  const { t, lang } = useTranslation();
  const activeContent = lang === "en" && block.contentEn ? block.contentEn : block.content;

  switch (block.type) {
    case "cover": {
      const c = activeContent as CoverBlockContent;
      return (
        <div className="relative flex min-h-[320px] flex-col justify-end overflow-hidden bg-ink-500 px-6 py-10 text-white">
          {c.heroImageUrl ? (
            <Image
              src={c.heroImageUrl}
              alt=""
              fill
              priority
              sizes="(min-width: 768px) 768px, 100vw"
              className="object-cover"
            />
          ) : (
            <div className="absolute -right-10 -top-10 opacity-20">
              <SunWatermark size={280} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink-500 via-ink-500/40 to-transparent" />
          <div className="relative">
            <p className="text-sm font-medium text-white/80">{c.eyebrow}</p>
            <h1 className="mt-1 font-display text-3xl font-semibold leading-tight sm:text-4xl">
              {meta.title || "Titel van de offerte"}
            </h1>
            {/* "Klantnaam"-placeholder is alleen zinvol in de bureau-builder
                (nog geen echte klant bekend) — op een publieke, klantloze
                weergave (readOnly) laten we deze regel weg i.p.v. letterlijk
                "Klantnaam" te tonen aan een willekeurige bezoeker. */}
            {(meta.clientName || meta.eventDate || c.eventDateLabel || !readOnly) && (
              <p className="mt-2 text-sm text-white/80">
                {meta.clientName || (readOnly ? "" : "Klantnaam")}
                {meta.eventDate && ` · ${formatDate(meta.eventDate)}`}
                {!meta.eventDate && c.eventDateLabel && ` · ${c.eventDateLabel}`}
              </p>
            )}
          </div>
        </div>
      );
    }

    case "text":
    case "terms": {
      const c = activeContent as TextBlockContent;
      return (
        <div className="px-6 py-10">
          <SectionHeading>{c.heading}</SectionHeading>
          <div
            className="prose prose-sm mt-3 max-w-none text-ink-400"
            dangerouslySetInnerHTML={{ __html: sanitizeBlockHtml(c.html) }}
          />
        </div>
      );
    }

    case "gallery": {
      const c = activeContent as GalleryBlockContent;
      return <GalleryBlockPreview heading={c.heading} images={c.images} noPhotosLabel={t("no_photos")} />;
    }

    case "packages": {
      const c = activeContent as PackagesBlockContent;
      return (
        <PackagesBlockPreview
          block={block}
          content={c}
          meta={meta}
          selections={selections}
          onSelectionsChange={onSelectionsChange}
          readOnly={readOnly}
          accentColor={accentColor}
        />
      );
    }

    case "arrangement": {
      const c = activeContent as ArrangementBlockContent;
      return (
        <ArrangementBlockPreview
          block={block}
          content={c}
          meta={meta}
          selections={selections}
          onSelectionsChange={onSelectionsChange}
          readOnly={readOnly}
          accentColor={accentColor}
        />
      );
    }

    case "timeline": {
      const c = activeContent as TimelineBlockContent;
      return (
        <div className="px-6 py-10">
          <SectionHeading>{c.heading}</SectionHeading>
          <div className="mt-5 flex flex-col gap-4">
            {c.items.map((item) => (
              <div key={item.id} className="flex gap-4">
                <span style={{ color: accentColor }} className="w-14 shrink-0 font-display text-sm font-semibold">{item.time}</span>
                <div className="flex-1 border-l border-ink-100 pb-4 pl-4">
                  <p className="text-sm font-medium text-ink-500">{item.title}</p>
                  {item.description && <p className="mt-0.5 text-sm text-ink-400">{item.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "signature": {
      // Zinloos zonder een echte quote erachter (publieke templatepreview).
      if (readOnly) return null;
      const c = activeContent as SignatureBlockContent;
      return (
        <div className="px-6 py-10">
          <SectionHeading>{c.heading}</SectionHeading>
          <p className="mt-2 text-sm text-ink-400">{c.intro}</p>
          <div className="mt-5 rounded-brand-lg border-2 border-dashed border-ink-200 px-6 py-10 text-center text-sm text-ink-300">
            {t("accept_and_sign")}
          </div>
        </div>
      );
    }
  }
}

/** Los component (niet een inline switch-case) omdat dit blok, i.t.t. de
 * andere bloktypes, eigen hooks nodig heeft (uitklap-status + meting van
 * afgekapte omschrijvingen op mobiel) — hooks mogen niet voorwaardelijk in
 * een switch-case binnen BlockPreview staan. */
/** Fotogalerij met lightbox: een klik op een foto zoomt 'm soepel uit vanaf
 * de plek van de thumbnail zelf (shared layoutId, geen "uit het niets"-
 * fade) i.p.v. een aparte lightbox-library. */
function GalleryBlockPreview({
  heading,
  images,
  noPhotosLabel,
}: {
  heading: string;
  images: GalleryBlockContent["images"];
  noPhotosLabel: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const openImg = images.find((img) => img.id === openId) ?? null;

  return (
    <div className="px-6 py-10">
      <SectionHeading>{heading}</SectionHeading>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((img) =>
          img.url ? (
            <motion.button
              key={img.id}
              type="button"
              layoutId={`gallery-${img.id}`}
              onClick={() => setOpenId(img.id)}
              className="relative aspect-square cursor-zoom-in overflow-hidden rounded-brand-sm bg-sand-200"
            >
              <Image src={img.url} alt={img.caption} fill sizes="(min-width: 640px) 33vw, 50vw" className="object-cover" />
            </motion.button>
          ) : null,
        )}
        {images.length === 0 && <p className="col-span-full text-sm text-ink-300">{noPhotosLabel}</p>}
      </div>

      <AnimatePresence>
        {openImg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-ink-500/85 p-6"
            onClick={() => setOpenId(null)}
          >
            <motion.div
              layoutId={`gallery-${openImg.id}`}
              className="relative h-[70vh] w-[min(90vw,700px)] cursor-auto overflow-hidden rounded-brand-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <Image src={openImg.url} alt={openImg.caption} fill sizes="90vw" className="object-contain" />
            </motion.div>
            <button
              type="button"
              onClick={() => setOpenId(null)}
              className="fixed right-5 top-5 flex size-10 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
            >
              <X className="size-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PackagesBlockPreview({
  block,
  content: c,
  meta,
  selections,
  onSelectionsChange,
  readOnly,
  accentColor,
}: {
  block: BlockDraft;
  content: PackagesBlockContent;
  meta: QuoteMeta;
  selections: Selections;
  onSelectionsChange: (s: Selections) => void;
  readOnly: boolean;
  accentColor: string;
}) {
  const { t } = useTranslation();
  const maxSelections = c.maxSelections ?? 1;
  const selectedIds = selections.packageIdByBlock[block.id] ?? [];
  const atMax = selectedIds.length >= maxSelections;

  // "Lees meer" op de mobiele rijenlijst: welke omschrijvingen zijn
  // daadwerkelijk afgekapt (gemeten, niet geraden) en welke staan open.
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [truncatedIds, setTruncatedIds] = useState<Set<string>>(new Set());
  const descRefs = useRef<Map<string, HTMLSpanElement>>(new Map());

  useEffect(() => {
    function measure() {
      const next = new Set<string>();
      descRefs.current.forEach((el, id) => {
        if (el.scrollWidth > el.clientWidth + 1) next.add(id);
      });
      setTruncatedIds(next);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [c.packages]);

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectPackage(pkg: { id: string }, disabled: boolean, isSelected: boolean) {
    if (disabled) return;
    let next: string[];
    if (maxSelections === 1) {
      if (isSelected) return;
      next = [pkg.id];
    } else if (isSelected) {
      next = selectedIds.filter((id) => id !== pkg.id);
    } else {
      next = [...selectedIds, pkg.id];
    }
    onSelectionsChange({
      ...selections,
      packageIdByBlock: { ...selections.packageIdByBlock, [block.id]: next },
    });
  }

  return (
    <div className="px-6 py-10">
      <SectionHeading>{c.heading}</SectionHeading>
      {c.intro && <p className="mt-2 text-sm text-ink-400">{c.intro}</p>}
      {!readOnly && maxSelections > 1 && (
        <p className="mt-1 text-xs font-medium text-ink-400">
          {t("choose_up_to_packages", { count: String(maxSelections) })}
        </p>
      )}

      {/* Mobiel: compacte rijenlijst (ongewijzigd). Desktop (sm+): grotere
          fotokaarten in een grid — beide gedeeld dezelfde klik-/
          selectielogica, alleen de opmaak verschilt per breakpoint. */}
      <div className="mt-5 flex flex-col overflow-hidden rounded-brand-lg border border-ink-100 sm:hidden">
        {c.packages.map((pkg, i) => {
          const isSelected = selectedIds.includes(pkg.id);
          const disabled = maxSelections > 1 && !isSelected && atMax;
          const isExpanded = expandedIds.has(pkg.id);
          const isTruncated = truncatedIds.has(pkg.id);
          const rowClassName = cn(
            "flex items-center gap-3 px-3.5 py-3 text-left transition-colors duration-200 ease-brand",
            i > 0 && "border-t border-ink-100",
            isSelected ? "bg-orange-50" : !readOnly && "hover:bg-sand-100",
            !readOnly && disabled && "opacity-40 hover:bg-transparent",
          );
          const rowContent = (
            <>
              <div className="relative size-11 shrink-0 overflow-hidden rounded-brand-sm bg-sand-200">
                {pkg.photoUrl ? (
                  <Image src={pkg.photoUrl} alt="" fill sizes="44px" className="object-cover" />
                ) : (
                  <div className="flex size-full items-center justify-center text-ink-300">
                    <ImageIcon className="size-4" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-1.5">
                  <span className="min-w-0 truncate font-display text-sm font-semibold text-ink-500">
                    {pkg.name}
                  </span>
                  {pkg.isDefaultSelected && (
                    <span className="kw-shimmer flex shrink-0 items-center gap-1 rounded-full bg-yellow-100 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-800">
                      <Star className="size-2.5 fill-yellow-600 text-yellow-600" /> {t("most_chosen")}
                    </span>
                  )}
                </div>
                {pkg.description && (
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span
                      ref={(el) => {
                        if (el) descRefs.current.set(pkg.id, el);
                        else descRefs.current.delete(pkg.id);
                      }}
                      className={cn("text-xs text-ink-400", !isExpanded && "min-w-0 flex-1 truncate")}
                    >
                      {pkg.description}
                    </span>
                    {(isTruncated || isExpanded) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpanded(pkg.id);
                        }}
                        style={{ color: accentColor }}
                        className="shrink-0 text-xs font-semibold hover:opacity-80"
                      >
                        {isExpanded ? t("show_less") : t("read_more")}
                      </button>
                    )}
                  </div>
                )}
              </div>
              <span className="shrink-0 font-display text-sm font-semibold text-orange-600">
                {priceLabel(pkg.price, meta.currency, meta.pricePerPerson)}
              </span>
              {!readOnly && (
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ease-brand",
                    isSelected ? "border-orange-500 bg-orange-500 text-white" : "border-ink-200",
                  )}
                  style={isSelected ? { boxShadow: `0 0 0 3px ${accentColor}33` } : undefined}
                >
                  {isSelected && <Check key={pkg.id} className="size-3 kw-pop-in" />}
                </span>
              )}
            </>
          );

          if (readOnly) {
            return (
              <div key={pkg.id} className={rowClassName}>
                {rowContent}
              </div>
            );
          }

          // Geen <button> hier: het "Lees meer"-knopje in rowContent is zelf
          // ook een <button> en een button-in-button is ongeldige HTML. Een
          // div met role="button" geeft dezelfde klik-/toetsenbordbediening
          // zonder die nesting.
          return (
            <div
              key={pkg.id}
              role="button"
              tabIndex={disabled ? -1 : 0}
              aria-disabled={disabled}
              aria-pressed={isSelected}
              onClick={() => selectPackage(pkg, disabled, isSelected)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  selectPackage(pkg, disabled, isSelected);
                }
              }}
              className={cn(rowClassName, "cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40")}
            >
              {rowContent}
            </div>
          );
        })}
      </div>

      <div className="mt-5 hidden gap-3.5 sm:grid sm:grid-cols-3">
            {c.packages.map((pkg) => {
              const isSelected = selectedIds.includes(pkg.id);
              const disabled = maxSelections > 1 && !isSelected && atMax;
              const cardClassName = cn(
                "flex flex-col overflow-hidden rounded-brand-lg border text-left transition-all duration-300 ease-brand",
                isSelected ? "border-2 border-orange-500" : "border-ink-100",
                !readOnly && !isSelected && "hover:border-ink-200",
                !readOnly && disabled && "opacity-40 hover:border-ink-100",
              );
              const cardStyle = isSelected ? { boxShadow: `0 0 0 3px ${accentColor}26` } : undefined;
              const cardContent = (
                <>
                  <div className="relative aspect-square shrink-0 bg-sand-200">
                    {pkg.photoUrl ? (
                      <Image src={pkg.photoUrl} alt="" fill sizes="(min-width: 640px) 33vw, 100vw" className="object-cover" />
                    ) : (
                      <div className="flex size-full items-center justify-center text-ink-300">
                        <ImageIcon className="size-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-1 px-3 py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-display text-sm font-semibold text-ink-500">{pkg.name}</span>
                      {pkg.isDefaultSelected && (
                        <span className="kw-shimmer flex shrink-0 items-center gap-1 rounded-full bg-yellow-100 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-800">
                          <Star className="size-2.5 fill-yellow-600 text-yellow-600" /> {t("most_chosen")}
                        </span>
                      )}
                    </div>
                    {pkg.description && <p className="text-xs text-ink-400">{pkg.description}</p>}
                    <span className="mt-1 font-display text-sm font-semibold text-orange-600">
                      {priceLabel(pkg.price, meta.currency, meta.pricePerPerson)}
                    </span>
                  </div>
                </>
              );

              if (readOnly) {
                return (
                  <div key={pkg.id} className={cardClassName} style={cardStyle}>
                    {cardContent}
                  </div>
                );
              }

              return (
                <button
                  key={pkg.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    if (disabled) return;
                    let next: string[];
                    if (maxSelections === 1) {
                      if (isSelected) return;
                      next = [pkg.id];
                    } else if (isSelected) {
                      next = selectedIds.filter((id) => id !== pkg.id);
                    } else {
                      next = [...selectedIds, pkg.id];
                    }
                    onSelectionsChange({
                      ...selections,
                      packageIdByBlock: { ...selections.packageIdByBlock, [block.id]: next },
                    });
                  }}
                  className={cardClassName}
                  style={cardStyle}
                >
                  {cardContent}
                </button>
              );
            })}
          </div>

          {c.addons.length > 0 && (
            <div className="mt-6 flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{t("extra_options")}</p>
              {c.addons.map((addon) => {
                const qty = selections.addonQuantities[addon.id] ?? 0;
                const checked = qty > 0;
                const lineTotal = addon.quantityEditable ? addon.price * (qty || 1) : addon.price;
                return (
                  <div
                    key={addon.id}
                    className="flex items-center justify-between gap-3 rounded-brand-sm border border-ink-100 px-3.5 py-3"
                  >
                    <label className="flex flex-1 items-center gap-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={readOnly}
                        onChange={
                          readOnly
                            ? undefined
                            : (e) =>
                                onSelectionsChange({
                                  ...selections,
                                  addonQuantities: {
                                    ...selections.addonQuantities,
                                    [addon.id]: e.target.checked ? (addon.quantityEditable ? addon.defaultQuantity || 1 : 1) : 0,
                                  },
                                })
                        }
                        style={{ accentColor }}
                        className="size-4 disabled:opacity-100"
                      />
                      <div>
                        <p className="text-sm font-medium text-ink-500">{addon.name}</p>
                        {addon.description && <p className="text-xs text-ink-400">{addon.description}</p>}
                      </div>
                    </label>
                    <div className="flex shrink-0 items-center gap-2">
                      {addon.quantityEditable && checked && (
                        <input
                          type="number"
                          min={1}
                          value={qty}
                          disabled={readOnly}
                          onChange={
                            readOnly
                              ? undefined
                              : (e) => {
                                  const next = Math.max(1, Math.trunc(Number(e.target.value)) || 1);
                                  onSelectionsChange({
                                    ...selections,
                                    addonQuantities: { ...selections.addonQuantities, [addon.id]: next },
                                  });
                                }
                          }
                          className="w-16 rounded-brand-sm border border-ink-200 px-2 py-1 text-right text-sm text-ink-500 outline-none focus:border-teal-400 disabled:opacity-100"
                        />
                      )}
                      <span className="text-sm font-medium text-ink-500 whitespace-nowrap">
                        +{priceLabel(lineTotal, meta.currency, meta.pricePerPerson && !addon.quantityEditable)}
                        {addon.quantityEditable && !checked ? ` ${t("per_item")}` : ""}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {(c.pdfUrl || c.pdfUrl2) && (
            <div className="mt-6 flex flex-col gap-2">
              {[
                { url: c.pdfUrl, label: c.pdfLabel },
                { url: c.pdfUrl2, label: c.pdfLabel2 },
              ]
                .filter((attachment) => attachment.url)
                .map(({ url, label }) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: accentColor }}
                    className="inline-flex items-center gap-2 text-sm font-medium underline hover:opacity-80"
                  >
                    <FileText className="size-4" />
                    {label ? t("packages_pdf_attachment_named", { name: label }) : t("packages_pdf_attachment")}
                  </a>
                ))}
            </div>
          )}
        </div>
      );
}

/** Volledige inhoud van één arrangement uit de catalogus, als momentopname
 * naar dit blok gekopieerd (zie newBlockFromArrangement) -- vakjes/tekst/
 * actievak/extra's rechtstreeks gemodelleerd op de aangeleverde
 * arrangement-PDF's. Extra's hergebruiken exact het addon-aanvink-patroon
 * hierboven (PackagesBlockPreview) via `selections.addonQuantities`, want
 * `collectPricedBlocks()` (lib/blocks/pricing.ts) zet ze al om naar
 * PackageAddon-vorm voor de totaalberekening. */
/** Breedte (1-4 van de 4 kolommen) -> statische Tailwind-classes. Bewust een
 * lookup-object i.p.v. een template-literal className: Tailwind's JIT-scanner
 * vindt alleen letterlijk in de broncode voorkomende klassen, geen dynamisch
 * samengestelde arbitrary-value-strings. */
const CONTENT_ITEM_WIDTH_CLASSES: Record<1 | 2 | 3 | 4, string> = {
  1: "sm:col-span-1 lg:col-span-1",
  2: "sm:col-span-2 lg:col-span-2",
  3: "sm:col-span-2 lg:col-span-3",
  4: "sm:col-span-2 lg:col-span-4",
};

function ArrangementContentItemView({
  item,
  arrangementColor,
  meta,
  selections,
  onSelectionsChange,
  readOnly,
}: {
  item: ArrangementBlockContent["contentItems"][number];
  arrangementColor: string;
  meta: QuoteMeta;
  selections: Selections;
  onSelectionsChange: (s: Selections) => void;
  readOnly: boolean;
}) {
  const itemColor = item.color ?? arrangementColor;
  const Icon = item.icon ? ARRANGEMENT_ICON_MAP[item.icon] : undefined;

  const header = item.type !== "image" && (item.title || Icon) && (
    <div className="flex items-center gap-2">
      {Icon && (
        <span
          className="flex size-7 shrink-0 items-center justify-center rounded-brand-sm"
          style={{ backgroundColor: `${itemColor}1a`, color: itemColor }}
        >
          <Icon className="size-4" />
        </span>
      )}
      {item.title && (
        <p className="text-sm font-semibold" style={{ color: itemColor }}>
          {item.title}
        </p>
      )}
    </div>
  );

  return (
    <div className={cn("flex flex-col gap-2", CONTENT_ITEM_WIDTH_CLASSES[item.width])}>
      {item.type === "text" && (
        <>
          {header}
          {item.body && <p className="whitespace-pre-line text-sm text-ink-400">{item.body}</p>}
        </>
      )}

      {item.type === "highlight" && (
        <div className="rounded-brand-sm px-4 py-3 text-sm text-white" style={{ backgroundColor: itemColor }}>
          {item.title && <strong className="font-semibold">{item.title}</strong>}
          {item.body && <> {item.body}</>}
        </div>
      )}

      {item.type === "category" && (
        <>
          {header}
          <ul className="flex flex-col gap-1">
            {item.items.map((sub) => (
              <li key={sub.id} className="text-sm text-ink-400">
                {sub.text}
                {sub.note && <span className="ml-1 text-xs text-ink-300">{sub.note}</span>}
              </li>
            ))}
          </ul>
        </>
      )}

      {item.type === "image" && (
        <div className="flex flex-col gap-1.5">
          {item.imageUrl && (
            <div className="relative aspect-video w-full overflow-hidden rounded-brand-sm bg-sand-200">
              <Image src={item.imageUrl} alt={item.caption || ""} fill className="object-cover" sizes="(min-width: 1024px) 25vw, 50vw" />
            </div>
          )}
          {item.caption && <p className="text-xs text-ink-400">{item.caption}</p>}
        </div>
      )}

      {item.type === "extras" && (
        <>
          {header}
          <div className="flex flex-col gap-2">
            {item.items.map((extra) => {
              const qty = selections.addonQuantities[extra.id] ?? 0;
              const checked = qty > 0;
              return (
                <div
                  key={extra.id}
                  className="flex items-center justify-between gap-3 rounded-brand-sm border border-ink-100 px-3.5 py-3"
                >
                  <label className="flex flex-1 items-center gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={readOnly}
                      onChange={
                        readOnly
                          ? undefined
                          : (e) =>
                              onSelectionsChange({
                                ...selections,
                                addonQuantities: { ...selections.addonQuantities, [extra.id]: e.target.checked ? 1 : 0 },
                              })
                      }
                      style={{ accentColor: itemColor }}
                      className="size-4 disabled:opacity-100"
                    />
                    <p className="text-sm font-medium text-ink-500">{extra.name}</p>
                  </label>
                  <span className="shrink-0 text-sm font-medium text-ink-500 whitespace-nowrap">
                    +{priceLabel(extra.price, meta.currency, extra.unit === "p.p.")}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function ArrangementBlockPreview({
  content: c,
  meta,
  selections,
  onSelectionsChange,
  readOnly,
  accentColor,
}: {
  block: BlockDraft;
  content: ArrangementBlockContent;
  meta: QuoteMeta;
  selections: Selections;
  onSelectionsChange: (s: Selections) => void;
  readOnly: boolean;
  accentColor: string;
}) {
  const { t } = useTranslation();
  const arrangementColor = c.colorCode || accentColor;

  return (
    <div className="px-6 py-10">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <SectionHeading>{c.heading || c.name}</SectionHeading>
        <span className="font-display text-xl font-semibold whitespace-nowrap" style={{ color: accentColor }}>
          {c.priceLabel ? t("from_price_prefix") : ""}
          {priceLabel(c.basePrice, meta.currency, meta.pricePerPerson)}
        </span>
      </div>
      {c.priceLabel && <p className="mt-0.5 text-xs text-ink-400">{c.priceLabel}</p>}
      {c.description && <p className="mt-2 text-sm text-ink-400">{c.description}</p>}

      {c.contentItems.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {c.contentItems.map((item) => (
            <ArrangementContentItemView
              key={item.id}
              item={item}
              arrangementColor={arrangementColor}
              meta={meta}
              selections={selections}
              onSelectionsChange={onSelectionsChange}
              readOnly={readOnly}
            />
          ))}
        </div>
      )}

      {c.pdfUrl && (
        <a
          href={c.pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: accentColor }}
          className="mt-6 inline-flex items-center gap-2 text-sm font-medium underline hover:opacity-80"
        >
          <FileText className="size-4" />
          {t("packages_pdf_attachment")}
        </a>
      )}
    </div>
  );
}
