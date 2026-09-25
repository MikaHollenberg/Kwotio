"use client";

import { useEffect, useMemo, useState } from "react";
import { LayoutTemplate, ChevronRight, Info, MessageCircleQuestion } from "lucide-react";
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
import { defaultSelections } from "@/lib/blocks/pricing";
import type { PackagesBlockContent } from "@/lib/blocks/types";
import { PUBLIC_PRICE_DISCLAIMER, PRIVACYBELEID_URL } from "@/lib/legal";
import { cn, formatCurrency } from "@/lib/utils";
import type { PublicOrgPageData } from "./data";
import { RequestFormModal } from "./request-form-modal";
import { LeadFormModal } from "./lead-form-modal";
import { logTemplateOpened, logRequestFormOpened } from "./analytics";

/** Eén kaart in de "Onze offertes"/"Onze arrangementen"-rasters -- bewust
 * één gedeeld component zodat beide secties er exact hetzelfde uitzien
 * (gevraagd: "Maak deze gelijk aan elkaar"), compact en duidelijk
 * aanklikbaar zonder het beeld te overheersen. Klikken wisselt de
 * uitgeklapte inhoud eronder, hetzelfde patroon als de offertes al hadden.
 * Bewust geen icoon/thumbnail-strip bovenaan (op verzoek verwijderd, eerst
 * als mockup goedgekeurd) -- de kaart begint direct met de naam. */
function ListingCard({
  title,
  description,
  priceLabel,
  accentColor,
  ctaLabel,
  selected,
  onClick,
}: {
  title: string;
  description: string | null;
  priceLabel?: string | null;
  accentColor: string;
  ctaLabel: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col overflow-hidden rounded-brand-lg border bg-white text-left shadow-sm transition-colors duration-200 ease-brand",
        selected ? "" : "border-ink-200/60 hover:border-ink-300",
      )}
      style={selected ? { borderColor: accentColor, borderWidth: 1.5 } : undefined}
    >
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="text-sm font-semibold text-ink-500">{title}</p>
        {priceLabel && (
          <span className="text-sm font-semibold" style={{ color: accentColor }}>
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

  return (
    <LanguageProvider initialLang="nl">
      <div className={cn(!embed && "relative isolate min-h-screen overflow-hidden bg-sand-100")}>
        {!embed && data.backgroundStyle === "coastline" && <CoastlineBackground />}
        {!embed && data.backgroundStyle === "icons" && <IconsBackground />}
        {!embed && (
          <header className="border-b border-ink-200/40 bg-white/80 px-6 py-4 backdrop-blur-sm">
            <div className="mx-auto flex max-w-3xl items-center gap-3">
              {data.logoUrl ? <Logo logoUrl={data.logoUrl} height={32} /> : <KwotioMark size={32} />}
              <span className="font-display text-lg font-semibold text-ink-500">{data.organizationName}</span>
            </div>
          </header>
        )}

        <div className={cn("mx-auto flex max-w-3xl flex-col gap-6", embed ? "px-1 py-4" : "px-4 py-8 sm:px-6")}>
          {data.welcomeMessage && (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-500">{data.welcomeMessage}</p>
          )}

          <div className="flex items-start gap-2.5 rounded-brand-sm border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            <Info className="mt-0.5 size-4 shrink-0" />
            <p>{PUBLIC_PRICE_DISCLAIMER}</p>
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
              <h2 className="font-display text-lg font-semibold text-ink-500">Onze offertes</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.templates.map((t) => (
                  <ListingCard
                    key={t.id}
                    title={t.name}
                    description={t.description}
                    accentColor={data.primaryColor}
                    ctaLabel="Bekijk offerte"
                    selected={t.id === selectedId}
                    onClick={() => selectTemplate(t.id)}
                  />
                ))}
              </div>

              {selectedTemplate && (
                <div className="overflow-hidden rounded-brand-lg border border-ink-200/60 bg-white shadow-sm">
                  <div className="font-sans text-ink-500">
                    {selectedTemplate.description && (
                      <p className="px-6 pt-6 text-sm text-ink-400">{selectedTemplate.description}</p>
                    )}
                    {[...selectedTemplate.blocks]
                      .sort((a, b) => a.position - b.position)
                      .map((block, i) => (
                        <div key={block.id}>
                          {i > 0 && (
                            <div className="px-6">
                              <WaveDivider className="text-blue-200" />
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
              )}

              <div className="sticky bottom-4 flex justify-center">
                <Button
                  size="lg"
                  style={{ backgroundColor: data.primaryColor }}
                  onClick={() => {
                    setFormOpen(true);
                    void logRequestFormOpened(orgSlug);
                  }}
                  className="shadow-lg hover:opacity-90 active:opacity-90"
                >
                  Vraag offerte aan
                </Button>
              </div>
            </div>
          )}

          {data.arrangements.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="font-display text-lg font-semibold text-ink-500">Onze arrangementen</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.arrangements.map((a) => (
                  <ListingCard
                    key={a.id}
                    title={a.name}
                    description={a.description}
                    priceLabel={
                      a.basePrice != null
                        ? `${a.isVariable ? "Vanaf " : ""}${formatCurrency(a.basePrice, "EUR")}${a.pricePerPerson ? " p.p." : ""}`
                        : undefined
                    }
                    accentColor={a.colorCode || data.primaryColor}
                    ctaLabel="Bekijk arrangement"
                    selected={a.id === selectedArrangementId}
                    onClick={() => selectArrangement(a.id)}
                  />
                ))}
              </div>

              {selectedArrangement && (
                <div className="overflow-hidden rounded-brand-lg border border-ink-200/60 bg-white shadow-sm">
                  <BlockPreview
                    block={selectedArrangement.block}
                    meta={META}
                    selections={{ packageIdByBlock: {}, addonQuantities: {} }}
                    onSelectionsChange={() => {}}
                    readOnly
                    accentColor={data.primaryColor}
                  />
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-4 rounded-brand-lg border border-ink-200/60 bg-white px-5 py-4">
            <div
              className="flex size-11 shrink-0 items-center justify-center rounded-brand-sm"
              style={{ backgroundColor: `${data.primaryColor}1a`, color: data.primaryColor }}
            >
              <MessageCircleQuestion className="size-5.5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink-500">Nog niet zeker wat je zoekt?</p>
              <p className="mt-0.5 text-xs text-ink-400">Laat gewoon je gegevens achter, dan nemen wij contact met je op.</p>
            </div>
            <button
              type="button"
              onClick={() => setLeadFormOpen(true)}
              style={{ borderColor: data.primaryColor, color: data.primaryColor }}
              className="shrink-0 whitespace-nowrap rounded-brand-sm border px-4 py-2 text-sm font-semibold hover:opacity-80"
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
        />
      )}
    </LanguageProvider>
  );
}
