"use client";

import { useEffect, useMemo, useState } from "react";
import { LayoutTemplate, Info } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { KwotioMark } from "@/components/brand/kwotio-mark";
import { WaveDivider } from "@/components/brand/wave-divider";
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

const META: QuoteMeta = {
  title: "",
  clientName: "",
  eventDate: null,
  currency: "EUR",
  priceDisplay: "incl_btw",
  pricePerPerson: false,
  discountAmount: 0,
};

export function PublicOrgPageView({ orgSlug, data }: { orgSlug: string; data: PublicOrgPageData }) {
  // Bewust geen automatisch geopende template — pas na een klik van de
  // bezoeker (of een gedeelde ?template=-link, zie het effect hieronder).
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    // Mobiele browsers onthouden soms de laatst gescrollde positie voor deze
    // link (scroll restoration) en openen de pagina daardoor niet bovenaan —
    // forceer altijd een schone start bovenaan.
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
  }, []);

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
    if (next) url.searchParams.set("template", next);
    else url.searchParams.delete("template");
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
      <div className="min-h-screen bg-sand-100">
        <header className="border-b border-ink-200/40 bg-white/80 px-6 py-4 backdrop-blur-sm">
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            {data.logoUrl ? <Logo logoUrl={data.logoUrl} height={32} priority /> : <KwotioMark size={32} />}
            <span className="font-display text-lg font-semibold text-ink-500">{data.organizationName}</span>
          </div>
        </header>

        <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
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
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors duration-200 ease-brand",
                      t.id === selectedId
                        ? "border-teal-500 bg-teal-500 text-white"
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
                          />
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="sticky bottom-4 flex justify-center">
                <Button size="lg" onClick={() => setFormOpen(true)} className="shadow-lg">
                  Vraag offerte aan
                </Button>
              </div>
            </>
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
          onClose={() => setFormOpen(false)}
        />
      )}
    </LanguageProvider>
  );
}
