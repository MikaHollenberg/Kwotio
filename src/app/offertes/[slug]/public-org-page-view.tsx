"use client";

import { useEffect, useMemo, useState } from "react";
import { LayoutTemplate, Info } from "lucide-react";
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
import { cn } from "@/lib/utils";
import type { PublicOrgPageData } from "./data";
import { RequestFormModal } from "./request-form-modal";
import { logTemplateOpened, logRequestFormOpened } from "./analytics";

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
  const [formOpen, setFormOpen] = useState(false);

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
      const height = Math.max(document.documentElement.scrollHeight, formOpen ? window.innerHeight : 0);
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
  }, [embed, formOpen]);

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

  const selectedTemplate = useMemo(
    () => data.templates.find((t) => t.id === selectedId) ?? null,
    [data.templates, selectedId],
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
            <>
              <div className="flex flex-wrap justify-center gap-1.5">
                {data.templates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => selectTemplate(t.id)}
                    style={t.id === selectedId ? { backgroundColor: data.primaryColor, borderColor: data.primaryColor } : undefined}
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors duration-200 ease-brand",
                      t.id === selectedId
                        ? "text-white"
                        : "border-ink-200 text-ink-400 hover:border-ink-300 hover:text-ink-500",
                    )}
                  >
                    {t.name}
                  </button>
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
            </>
          )}

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
    </LanguageProvider>
  );
}
