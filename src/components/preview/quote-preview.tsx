"use client";

import Image from "next/image";
import { Check, FileText, Star } from "lucide-react";
import type { BlockDraft } from "@/lib/blocks/types";
import type {
  CoverBlockContent,
  TextBlockContent,
  GalleryBlockContent,
  PackagesBlockContent,
  TimelineBlockContent,
  SignatureBlockContent,
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

export { PRICE_DISPLAY_LABELS };

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
  const { packagesBlocks, selections, setSelections, subtotal } = useQuoteSelections(blocks);
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

        {packagesBlocks.length > 0 && (
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
}: {
  block: BlockDraft;
  meta: QuoteMeta;
  selections: Selections;
  onSelectionsChange: (s: Selections) => void;
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
            <p className="mt-2 text-sm text-white/80">
              {meta.clientName || "Klantnaam"}
              {meta.eventDate && ` · ${formatDate(meta.eventDate)}`}
              {!meta.eventDate && c.eventDateLabel && ` · ${c.eventDateLabel}`}
            </p>
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
            dangerouslySetInnerHTML={{ __html: c.html }}
          />
        </div>
      );
    }

    case "gallery": {
      const c = activeContent as GalleryBlockContent;
      return (
        <div className="px-6 py-10">
          <SectionHeading>{c.heading}</SectionHeading>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {c.images.map((img) =>
              img.url ? (
                <div key={img.id} className="relative aspect-square overflow-hidden rounded-brand-sm bg-sand-200">
                  <Image
                    src={img.url}
                    alt={img.caption}
                    fill
                    sizes="(min-width: 640px) 33vw, 50vw"
                    className="object-cover"
                  />
                </div>
              ) : null,
            )}
            {c.images.length === 0 && (
              <p className="col-span-full text-sm text-ink-300">{t("no_photos")}</p>
            )}
          </div>
        </div>
      );
    }

    case "packages": {
      const c = activeContent as PackagesBlockContent;
      return (
        <div className="px-6 py-10">
          <SectionHeading>{c.heading}</SectionHeading>
          {c.intro && <p className="mt-2 text-sm text-ink-400">{c.intro}</p>}

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {c.packages.map((pkg) => {
              const isSelected = selections.packageIdByBlock[block.id] === pkg.id;
              return (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() =>
                    onSelectionsChange({
                      ...selections,
                      packageIdByBlock: { ...selections.packageIdByBlock, [block.id]: pkg.id },
                    })
                  }
                  className={cn(
                    "flex flex-col overflow-hidden rounded-brand-lg border-2 text-left transition-all duration-200 ease-brand",
                    isSelected ? "border-orange-500 shadow-md" : "border-ink-100 hover:border-ink-200",
                  )}
                >
                  {pkg.photoUrl && (
                    <div className="relative aspect-[16/10] bg-sand-200">
                      <Image
                        src={pkg.photoUrl}
                        alt=""
                        fill
                        sizes="(min-width: 640px) 50vw, 100vw"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-display text-lg font-semibold text-ink-500">{pkg.name}</span>
                      {pkg.isDefaultSelected && (
                        <span className="flex shrink-0 items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-[11px] font-semibold text-yellow-800">
                          <Star className="size-3 fill-yellow-600 text-yellow-600" /> {t("most_chosen")}
                        </span>
                      )}
                    </div>
                    <p className="flex-1 text-sm text-ink-400">{pkg.description}</p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="font-display text-xl font-semibold text-orange-600">
                        {priceLabel(pkg.price, meta.currency, meta.pricePerPerson)}
                      </span>
                      <span
                        className={cn(
                          "flex size-6 items-center justify-center rounded-full border-2",
                          isSelected ? "border-orange-500 bg-orange-500 text-white" : "border-ink-200",
                        )}
                      >
                        {isSelected && <Check className="size-3.5" />}
                      </span>
                    </div>
                  </div>
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
                        onChange={(e) =>
                          onSelectionsChange({
                            ...selections,
                            addonQuantities: {
                              ...selections.addonQuantities,
                              [addon.id]: e.target.checked ? (addon.quantityEditable ? addon.defaultQuantity || 1 : 1) : 0,
                            },
                          })
                        }
                        className="size-4 accent-teal-600"
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
                          onChange={(e) => {
                            const next = Math.max(1, Math.trunc(Number(e.target.value)) || 1);
                            onSelectionsChange({
                              ...selections,
                              addonQuantities: { ...selections.addonQuantities, [addon.id]: next },
                            });
                          }}
                          className="w-16 rounded-brand-sm border border-ink-200 px-2 py-1 text-right text-sm text-ink-500 outline-none focus:border-teal-400"
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

          {c.pdfUrl && (
            <a
              href={c.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-teal-600 underline decoration-teal-200 hover:text-teal-700"
            >
              <FileText className="size-4" /> {t("packages_pdf_attachment")}
            </a>
          )}
        </div>
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
                <span className="w-14 shrink-0 font-display text-sm font-semibold text-teal-600">{item.time}</span>
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
