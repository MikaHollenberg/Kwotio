"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { LayoutTemplate, ChevronRight, Info, MessageCircleQuestion, X, CircleCheck, HeartHandshake, Clock, ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { KwotioMark } from "@/components/brand/kwotio-mark";
import { WaveDivider } from "@/components/brand/wave-divider";
import { CoastlineBackground } from "@/components/brand/coastline-background";
import { IconsBackground } from "@/components/brand/icons-background";
import { LocationSection } from "./location-section";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LanguageProvider } from "@/lib/i18n/language-context";
import { BlockPreview, type QuoteMeta } from "@/components/preview/quote-preview";
import { CountUpPrice } from "@/components/preview/count-up-price";
import { defaultSelections } from "@/lib/blocks/pricing";
import type { PackagesBlockContent } from "@/lib/blocks/types";
import { PUBLIC_PRICE_DISCLAIMER, PRIVACYBELEID_URL } from "@/lib/legal";
import { cn, formatCurrency } from "@/lib/utils";
import type { PublicOrgPageData } from "./data";
import { RequestFormModal } from "./request-form-modal";
import { LeadFormModal } from "./lead-form-modal";
import { logTemplateOpened, logRequestFormOpened } from "./analytics";

/** Vertraging (ms) voor de gestaffelde intro van het n-de element. */
function riseStyle(delayMs: number): CSSProperties {
  return { "--kw-delay": `${delayMs}ms` } as CSSProperties;
}

/** Eén kaart in de "Onze offertes"/"Onze arrangementen"-rasters -- bewust
 * één gedeeld component zodat beide secties er exact hetzelfde uitzien
 * (gevraagd: "Maak deze gelijk aan elkaar"), compact en duidelijk
 * aanklikbaar zonder het beeld te overheersen. Klikken wisselt de
 * uitgeklapte inhoud eronder, hetzelfde patroon als de offertes al hadden.
 * Bewust geen icoon/thumbnail-strip bovenaan (op verzoek verwijderd, eerst
 * als mockup goedgekeurd) -- de kaart begint direct met de naam.
 *
 * De buitenste wrapper regelt alleen de gestaffelde intro (index bepaalt de
 * vertraging); de knop zelf heeft hover-lift en een korte "pop" bij selecteren
 * -- gescheiden elementen, omdat beide een transform-animatie gebruiken. */
function ListingCard({
  title,
  description,
  priceLabel,
  accentColor,
  ctaLabel,
  selected,
  onClick,
  index,
}: {
  title: string;
  description: string | null;
  priceLabel?: string | null;
  accentColor: string;
  ctaLabel: string;
  selected: boolean;
  onClick: () => void;
  index: number;
}) {
  return (
    <div className="kw-rise flex" style={riseStyle(280 + index * 70)}>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "kw-lift flex flex-1 flex-col overflow-hidden rounded-brand-lg border bg-white text-left shadow-sm",
          selected ? "kw-card-pop" : "border-ink-200/60",
        )}
        style={
          {
            "--kw-accent": accentColor,
            ...(selected ? { borderColor: accentColor, borderWidth: 1.5 } : {}),
          } as CSSProperties
        }
      >
        <div className="flex flex-1 flex-col gap-1.5 p-4">
          <p className="text-sm font-semibold text-ink-500">{title}</p>
          {priceLabel && (
            <span
              className="w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold"
              style={{ color: accentColor, backgroundColor: `color-mix(in srgb, ${accentColor} 12%, white)` }}
            >
              {priceLabel}
            </span>
          )}
          {description && <p className="line-clamp-2 flex-1 text-xs text-ink-400">{description}</p>}
          <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold" style={{ color: accentColor }}>
            {ctaLabel}
            <ChevronRight className="size-3.5" />
          </span>
        </div>
      </button>
    </div>
  );
}

/** De hoofd-knop "Vraag offerte aan": springt op zodra hij in beeld komt, zweeft
 * daarna rustig, krijgt af en toe een glans, schuift bij hover een pijltje uit
 * en voelt ingedrukt bij een klik. Het zweven zit op de wrapper en de pop/
 * press op de knop zelf, omdat beide een transform gebruiken. */
function RequestButton({ accentColor, onClick }: { accentColor: string; onClick: () => void }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      const frame = requestAnimationFrame(() => setInView(true));
      return () => cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className={cn(inView && "kw-cta-bob")}>
      <Button
        size="lg"
        style={{ backgroundColor: accentColor }}
        onClick={onClick}
        className={cn(
          "kw-cta-shine kw-cta-press group shadow-lg hover:opacity-90 active:opacity-90",
          inView ? "kw-cta-pop" : "opacity-0",
        )}
      >
        Vraag offerte aan
        <span className="-ml-2 flex w-0 items-center overflow-hidden opacity-0 transition-all duration-300 ease-brand group-hover:ml-0 group-hover:w-5 group-hover:opacity-100">
          <ArrowRight className="size-5 shrink-0" />
        </span>
      </Button>
    </div>
  );
}

/** Sectiekop met een kort eyebrow-label + accentstreepje boven de titel. */
function SectionHead({
  eyebrow,
  title,
  accentColor,
  delayMs,
}: {
  eyebrow: string;
  title: string;
  accentColor: string;
  delayMs: number;
}) {
  return (
    <div className="kw-rise flex flex-col gap-1" style={riseStyle(delayMs)}>
      <span
        className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.08em]"
        style={{ color: accentColor }}
      >
        {eyebrow}
        <span className="h-0.5 w-10 rounded-full opacity-50" style={{ backgroundColor: accentColor }} />
      </span>
      <h2 className="font-display text-xl font-semibold text-ink-500">{title}</h2>
    </div>
  );
}

/** Mini-balk bovenin een uitgeklapte offerte/arrangement: blijft bij het
 * scrollen bovenin staan (sticky) zodat je altijd weet waar je naar kijkt,
 * met de prijs (telt op bij het openen) en een sluitknop. */
function PanelBar({
  title,
  amount,
  pricePrefix,
  priceSuffix,
  accentColor,
  onClose,
}: {
  title: string;
  amount?: number | null;
  pricePrefix?: string;
  priceSuffix?: string;
  accentColor: string;
  onClose: () => void;
}) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-ink-100 bg-white/90 px-5 py-3 backdrop-blur-sm">
      <p className="min-w-0 truncate text-sm font-semibold text-ink-500">{title}</p>
      <div className="flex shrink-0 items-center gap-2">
        {amount != null && (
          <span className="text-sm font-semibold" style={{ color: accentColor }}>
            <CountUpPrice amount={amount} prefix={pricePrefix} suffix={priceSuffix} />
          </span>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Sluiten"
          className="flex size-7 items-center justify-center rounded-full text-ink-400 transition-colors duration-200 ease-brand hover:bg-sand-200 hover:text-ink-500"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

const META: QuoteMeta = {
  title: "",
  clientName: "",
  eventDate: null,
  currency: "EUR",
  priceDisplay: "incl_btw",
  pricePerPerson: false,
  discountAmount: 0,
};

export function PublicOrgPageView({
  orgSlug,
  data,
  embed = false,
}: {
  orgSlug: string;
  data: PublicOrgPageData;
  /** Kale variant voor de <iframe>-embed op de eigen website van een
   * organisatie: geen kop/voettekst/eigen achtergrond (die zou dubbelop zijn
   * met de omliggende site), en meldt zijn eigen hoogte aan de host-pagina
   * (zie public/embed.js) zodat de iframe nooit een scrollbalkje krijgt. */
  embed?: boolean;
}) {
  // Bewust geen automatisch geopende template — pas na een klik van de
  // bezoeker (of een gedeelde ?template=-link, zie het effect hieronder).
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedArrangementId, setSelectedArrangementId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [leadFormOpen, setLeadFormOpen] = useState(false);
  // Alleen gezet als het leadformulier vanaf de "Vraag dit arrangement aan"-
  // knop bij een uitgeklapt arrangement geopend is -- de gewone "Neem
  // contact op"-knop onderaan laat dit op null staan.
  const [leadFormArrangementName, setLeadFormArrangementName] = useState<string | null>(null);

  useEffect(() => {
    if (embed) return;
    // Mobiele browsers onthouden soms de laatst gescrollde positie voor deze
    // link (scroll restoration) en openen de pagina daardoor niet bovenaan —
    // forceer altijd een schone start bovenaan.
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
  }, [embed]);

  useEffect(() => {
    if (!embed) return;
    // targetOrigin "*" is bewust: de host-site kan elk domein zijn (dat is
    // het hele punt van embedden) en het bericht bevat toch niets gevoeligers
    // dan een pixelhoogte. Bij open modal ook window.innerHeight meenemen --
    // het aanvraagformulier is een position:fixed overlay die niet meetelt
    // in scrollHeight, en zou anders binnen een te lage iframe afgesneden
    // worden.
    function postHeight() {
      const modalOpen = formOpen || leadFormOpen;
      const height = Math.max(document.documentElement.scrollHeight, modalOpen ? window.innerHeight : 0);
      window.parent.postMessage({ type: "kwotio-embed-resize", height }, "*");
    }
    const observer = new ResizeObserver(postHeight);
    observer.observe(document.documentElement);
    window.addEventListener("resize", postHeight);
    postHeight();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", postHeight);
    };
  }, [embed, formOpen, leadFormOpen]);

  useEffect(() => {
    // Eenmalige sync vanaf de URL bij het laden (deelbare ?template=-link) —
    // bewust in een effect i.p.v. een lazy useState-initializer, want de
    // server rendert zonder window en zou anders een hydration-mismatch geven.
    const fromUrl = new URLSearchParams(window.location.search).get("template");
    if (fromUrl && data.templates.some((t) => t.id === fromUrl)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedId(fromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectTemplate(id: string) {
    const next = selectedId === id ? null : id;
    setSelectedId(next);
    const url = new URL(window.location.href);
    if (next) {
      url.searchParams.set("template", next);
      void logTemplateOpened(orgSlug, next);
    } else {
      url.searchParams.delete("template");
    }
    window.history.replaceState({}, "", url);
  }

  function selectArrangement(id: string) {
    setSelectedArrangementId((current) => (current === id ? null : id));
  }

  const selectedTemplate = useMemo(
    () => data.templates.find((t) => t.id === selectedId) ?? null,
    [data.templates, selectedId],
  );
  const selectedArrangement = useMemo(
    () => data.arrangements.find((a) => a.id === selectedArrangementId) ?? null,
    [data.arrangements, selectedArrangementId],
  );
  const selections = useMemo(
    () =>
      selectedTemplate
        ? defaultSelections(
            selectedTemplate.blocks
              .filter((b) => b.type === "packages")
              .map((b) => {
                const content = b.content as PackagesBlockContent;
                return { blockId: b.id, packages: content.packages, addons: content.addons };
              }),
          )
        : { packageIdByBlock: {}, addonQuantities: {} },
    [selectedTemplate],
  );

  const expandedTemplateContent = selectedTemplate && (
    <div className="overflow-clip rounded-brand-lg border border-ink-200/60 bg-white shadow-sm">
      <PanelBar
        title={selectedTemplate.name}
        accentColor={data.primaryColor}
        onClose={() => selectTemplate(selectedTemplate.id)}
      />
      <div className="font-sans text-ink-500">
        {selectedTemplate.description && (
          <p className="kw-rise px-6 pt-6 text-sm text-ink-400" style={riseStyle(60)}>
            {selectedTemplate.description}
          </p>
        )}
        {[...selectedTemplate.blocks]
          .sort((a, b) => a.position - b.position)
          .map((block, i) => (
            <div key={block.id} className="kw-rise" style={riseStyle(140 + i * 90)}>
              {i > 0 && (
                <div className="px-6">
                  <WaveDivider className="text-blue-200" draw delayMs={260 + i * 90} />
                </div>
              )}
              <BlockPreview
                block={block}
                meta={{ ...META, title: selectedTemplate.name }}
                selections={selections}
                onSelectionsChange={() => {}}
                readOnly
                accentColor={data.primaryColor}
              />
            </div>
          ))}
      </div>
    </div>
  );

  const expandedArrangementContent = selectedArrangement && (
    <div className="overflow-clip rounded-brand-lg border border-ink-200/60 bg-white shadow-sm">
      <PanelBar
        title={selectedArrangement.name}
        amount={selectedArrangement.basePrice}
        pricePrefix={selectedArrangement.isVariable ? "Vanaf " : ""}
        priceSuffix={selectedArrangement.pricePerPerson ? " p.p." : ""}
        accentColor={selectedArrangement.colorCode || data.primaryColor}
        onClose={() => selectArrangement(selectedArrangement.id)}
      />
      <div className="kw-rise" style={riseStyle(80)}>
        <BlockPreview
          block={selectedArrangement.block}
          meta={META}
          selections={{ packageIdByBlock: {}, addonQuantities: {} }}
          onSelectionsChange={() => {}}
          readOnly
          accentColor={data.primaryColor}
        />
      </div>
      <div className="kw-rise flex justify-center border-t border-ink-100 px-6 py-5" style={riseStyle(200)}>
        <Button
          style={{ backgroundColor: data.primaryColor }}
          className="hover:opacity-90 active:opacity-90"
          onClick={() => {
            setLeadFormArrangementName(selectedArrangement.name);
            setLeadFormOpen(true);
          }}
        >
          Vraag {selectedArrangement.name} aan
        </Button>
      </div>
    </div>
  );

  const primary = data.primaryColor;
  const requestButton = (
    <RequestButton
      accentColor={primary}
      onClick={() => {
        setFormOpen(true);
        void logRequestFormOpened(orgSlug);
      }}
    />
  );

  return (
    <LanguageProvider initialLang="nl">
      <div className={cn(!embed && "relative isolate min-h-screen overflow-clip bg-sand-100")}>
        {!embed && data.backgroundStyle === "coastline" && <CoastlineBackground />}
        {!embed && data.backgroundStyle === "icons" && <IconsBackground />}
        {!embed && (
          <header
            className="kw-rise border-b border-ink-200/40 px-6 py-5"
            style={{
              backgroundImage: `linear-gradient(135deg, color-mix(in srgb, ${primary} 16%, transparent), transparent 65%)`,
              backgroundColor: "rgb(255 255 255 / 0.85)",
            }}
          >
            <div className="mx-auto flex max-w-3xl items-center gap-3.5">
              <div className="flex shrink-0 items-center rounded-brand-sm bg-white px-3 py-2 shadow-[0_8px_20px_rgba(30,46,56,0.14)]">
                {data.logoUrl ? <Logo logoUrl={data.logoUrl} height={32} /> : <KwotioMark size={32} />}
              </div>
              <span className="font-display text-lg font-semibold text-ink-500">{data.organizationName}</span>
            </div>
          </header>
        )}

        <div
          className={cn(
            "mx-auto flex max-w-3xl flex-col gap-6",
            embed ? "px-1 py-4" : "px-4 py-8 sm:px-6",
          )}
        >
          {data.welcomeMessage && (
            <p
              className="kw-rise whitespace-pre-wrap text-sm leading-relaxed text-ink-500"
              style={riseStyle(90)}
            >
              {data.welcomeMessage}
            </p>
          )}

          <div
            className="kw-rise flex items-start gap-2.5 rounded-brand-sm border border-ink-200/60 bg-white px-4 py-3"
            style={riseStyle(160)}
          >
            <span
              className="mt-px flex size-6 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: `color-mix(in srgb, ${primary} 14%, white)`, color: primary }}
            >
              <Info className="size-3.5" />
            </span>
            <p className="text-xs leading-relaxed text-ink-400">{PUBLIC_PRICE_DISCLAIMER}</p>
          </div>

          {data.templates.length === 0 ? (
            <Card className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <LayoutTemplate className="size-8 text-ink-300" />
              <p className="text-sm text-ink-400">
                Er zijn op dit moment geen offertes beschikbaar om te bekijken.
              </p>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              <SectionHead eyebrow="Kies je dag" title="Onze offertes" accentColor={primary} delayMs={220} />

              {/* Mobiel (< sm): elke offerte klapt direct onder zichzelf open
                  i.p.v. pas onderaan de hele lijst (live gemeld: op een
                  smal scherm moest je eerst langs alle andere offertes
                  scrollen). Aparte render i.p.v. JS-breakpoint-detectie --
                  zelfde patroon als offertes-table.tsx elders in de app,
                  voorkomt een hydration-mismatch. */}
              <div className="flex flex-col gap-3 sm:hidden">
                {data.templates.map((t, i) => (
                  <div key={t.id} className="flex flex-col">
                    <ListingCard
                      index={i}
                      title={t.name}
                      description={t.description}
                      accentColor={primary}
                      ctaLabel="Bekijk offerte"
                      selected={t.id === selectedId}
                      onClick={() => selectTemplate(t.id)}
                    />
                    <div
                      className="grid transition-[grid-template-rows] duration-300 ease-brand"
                      style={{ gridTemplateRows: t.id === selectedId ? "1fr" : "0fr" }}
                    >
                      <div className="min-h-0 overflow-clip">
                        <div className="pt-3">{t.id === selectedId && expandedTemplateContent}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tablet/desktop (>= sm): raster + één gedeelde uitklap-sectie
                  onderaan, ongewijzigd -- een uitklap-per-kaart zou hier het
                  raster breken zodra een kaart niet in de laatste rij staat. */}
              <div className="hidden gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-3">
                {data.templates.map((t, i) => (
                  <ListingCard
                    key={t.id}
                    index={i}
                    title={t.name}
                    description={t.description}
                    accentColor={primary}
                    ctaLabel="Bekijk offerte"
                    selected={t.id === selectedId}
                    onClick={() => selectTemplate(t.id)}
                  />
                ))}
              </div>
              {selectedTemplate && <div className="hidden sm:block">{expandedTemplateContent}</div>}

              <div className="flex justify-center">{requestButton}</div>
            </div>
          )}

          {data.arrangements.length > 0 && (
            <div className="flex flex-col gap-3">
              <SectionHead eyebrow="Compleet pakket" title="Onze arrangementen" accentColor={primary} delayMs={220} />

              {/* Mobiel (< sm): zelfde per-kaart-uitklap-patroon als "Onze offertes"
                  hierboven. */}
              <div className="flex flex-col gap-3 sm:hidden">
                {data.arrangements.map((a, i) => (
                  <div key={a.id} className="flex flex-col">
                    <ListingCard
                      index={i}
                      title={a.name}
                      description={a.description}
                      priceLabel={
                        a.basePrice != null
                          ? `${a.isVariable ? "Vanaf " : ""}${formatCurrency(a.basePrice, "EUR")}${a.pricePerPerson ? " p.p." : ""}`
                          : undefined
                      }
                      accentColor={a.colorCode || primary}
                      ctaLabel="Bekijk arrangement"
                      selected={a.id === selectedArrangementId}
                      onClick={() => selectArrangement(a.id)}
                    />
                    <div
                      className="grid transition-[grid-template-rows] duration-300 ease-brand"
                      style={{ gridTemplateRows: a.id === selectedArrangementId ? "1fr" : "0fr" }}
                    >
                      <div className="min-h-0 overflow-clip">
                        <div className="pt-3">{a.id === selectedArrangementId && expandedArrangementContent}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tablet/desktop (>= sm): raster + gedeelde uitklap-sectie onderaan,
                  ongewijzigd. */}
              <div className="hidden gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-3">
                {data.arrangements.map((a, i) => (
                  <ListingCard
                    key={a.id}
                    index={i}
                    title={a.name}
                    description={a.description}
                    priceLabel={
                      a.basePrice != null
                        ? `${a.isVariable ? "Vanaf " : ""}${formatCurrency(a.basePrice, "EUR")}${a.pricePerPerson ? " p.p." : ""}`
                        : undefined
                    }
                    accentColor={a.colorCode || primary}
                    ctaLabel="Bekijk arrangement"
                    selected={a.id === selectedArrangementId}
                    onClick={() => selectArrangement(a.id)}
                  />
                ))}
              </div>
              {selectedArrangement && <div className="hidden sm:block">{expandedArrangementContent}</div>}
            </div>
          )}

          <div className="kw-rise flex flex-wrap justify-center gap-2.5" style={riseStyle(120)}>
            {[
              { Icon: CircleCheck, label: "Vrijblijvend aanvragen" },
              { Icon: HeartHandshake, label: "Persoonlijk contact" },
              { Icon: Clock, label: "Binnen 24 uur reactie" },
            ].map(({ Icon, label }) => (
              <span
                key={label}
                className="flex items-center gap-1.5 rounded-full border border-ink-200/60 bg-white px-3 py-1.5 text-xs font-semibold text-ink-400"
              >
                <Icon className="size-3.5" style={{ color: primary }} />
                {label}
              </span>
            ))}
          </div>

          <div
            className="kw-rise flex items-center gap-4 rounded-brand-lg border border-ink-200/60 bg-white px-5 py-4 shadow-sm"
            style={riseStyle(180)}
          >
            <div
              className="flex size-12 shrink-0 items-center justify-center rounded-2xl"
              style={{
                backgroundColor: `color-mix(in srgb, ${primary} 14%, white)`,
                color: primary,
                boxShadow: `0 0 0 4px color-mix(in srgb, ${primary} 7%, transparent)`,
              }}
            >
              <MessageCircleQuestion className="size-5.5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink-500">Nog niet zeker wat je zoekt?</p>
              <p className="mt-0.5 text-xs text-ink-400">Laat gewoon je gegevens achter, dan nemen wij contact met je op.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setLeadFormArrangementName(null);
                setLeadFormOpen(true);
              }}
              style={{ "--kw-accent": primary, borderColor: primary, color: primary } as CSSProperties}
              className="shrink-0 whitespace-nowrap rounded-brand-sm border px-4 py-2 text-sm font-semibold transition-colors duration-200 ease-brand hover:bg-[var(--kw-accent)] hover:!text-white"
            >
              Neem contact op
            </button>
          </div>

          {data.locationPhotoUrl && (
            <LocationSection
              photoUrl={data.locationPhotoUrl}
              caption={data.locationCaption}
              address={data.locationAddress}
              organizationName={data.organizationName}
              accentColor={data.primaryColor}
            />
          )}
        </div>

        <footer className="px-6 py-6 text-center text-xs text-ink-300">
          {data.termsUrl && (
            <>
              <a href={data.termsUrl} target="_blank" rel="noopener noreferrer" className="hover:text-ink-400 hover:underline">
                Algemene voorwaarden van {data.organizationName}
              </a>
              {" · "}
            </>
          )}
          <a href={PRIVACYBELEID_URL} target="_blank" rel="noopener noreferrer" className="hover:text-ink-400 hover:underline">
            Privacybeleid
          </a>
        </footer>
      </div>

      {formOpen && (
        <RequestFormModal
          orgSlug={orgSlug}
          templates={data.templates.map((t) => ({ id: t.id, name: t.name }))}
          initialTemplateId={selectedTemplate?.id ?? null}
          guestCountFieldActive={data.guestCountFieldActive}
          guestCountFieldLabel={data.guestCountFieldLabel}
          closedDates={data.closedDates}
          closedWeekdays={data.closedWeekdays}
          onClose={() => setFormOpen(false)}
        />
      )}
      {leadFormOpen && (
        <LeadFormModal
          orgSlug={orgSlug}
          closedDates={data.closedDates}
          closedWeekdays={data.closedWeekdays}
          accentColor={data.primaryColor}
          onClose={() => setLeadFormOpen(false)}
          initialPurpose={leadFormArrangementName ? "arrangement" : undefined}
          initialMessage={leadFormArrangementName ? `Interesse in arrangement: ${leadFormArrangementName}` : undefined}
        />
      )}
    </LanguageProvider>
  );
}
