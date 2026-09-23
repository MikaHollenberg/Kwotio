"use client";

import { createPortal } from "react-dom";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSpotlightRect } from "./use-spotlight-rect";
import { SpotlightOverlay } from "./spotlight-overlay";

export type TourStep = {
  href: string;
  /** `data-faq-id`-waarde van een écht onderdeel op die pagina (dezelfde
   * markers als de FAQ-stappenplannen al gebruiken, zie faq-content.tsx). */
  target: string;
  title: string;
  description: string;
  adminOnly?: boolean;
  invoicingOnly?: boolean;
  /** Deze stap spotlight't het menu-item van de pagina (i.p.v. inhoud op de
   * pagina zelf) -- MobileNav klapt zichzelf dan open, zie tour-context.tsx.
   * Elke pagina begint hiermee ("waar vind ik dit"), gevolgd door 2-3
   * content-stappen ("wat kan ik hier doen"). */
  isNavStep?: true;
};

type ContentStepDef = { target: string; title: string; description: string };

/** Eén nav-stap + 2-3 content-stappen per hoofdpagina: eerst waar de pagina
 * in het menu staat, dan een paar echte, betekenisvolle onderdelen erop --
 * i.p.v. alleen het menu-item (te mager) of alleen pagina-inhoud (dan mis je
 * "waar vind ik dit ook alweer"). Spotlight't overal een écht element op de
 * pagina zelf (zie `TourStep.target`), nooit alleen de sidebar-link, dus
 * werkt dit identiek op desktop en mobiel. */
function pageSteps(
  href: string,
  navLabel: string,
  contentSteps: ContentStepDef[],
  flags?: { adminOnly?: true; invoicingOnly?: true },
): TourStep[] {
  const navStep: TourStep = {
    href,
    target: `nav-${href.split("/").pop()}`,
    title: navLabel,
    description: `Dit vind je in het menu onder '${navLabel}'.`,
    isNavStep: true,
    ...flags,
  };
  return [navStep, ...contentSteps.map((c) => ({ href, ...c, ...flags }))];
}

/** Facturen/Statistieken/Administratie/Instellingen zijn `adminOnly` en/of
 * `invoicingOnly`; de aanroeper (TourProvider) filtert die eruit voor een
 * teamlid/alleen-lezen-rol of een organisatie zonder facturatie. */
export const ALL_TOUR_STEPS: TourStep[] = [
  ...pageSteps("/dashboard", "Overzicht", [
    {
      target: "dashboard-kpis",
      title: "Belangrijkste cijfers",
      description:
        "Aantal offertes deze maand, conversieratio, gemiddelde doorlooptijd en je populairste pakket -- in één oogopslag.",
    },
    {
      target: "dashboard-events",
      title: "Aankomende events",
      description: "Je eerstvolgende evenementen in kalendervorm, met een gloed op elke dag waarop iets gepland staat.",
    },
    {
      target: "dashboard-activity",
      title: "Recente activiteit",
      description:
        "Live overzicht van wat er gebeurt: offertes bekeken, ondertekend, aanvragen binnengekomen, en meer.",
    },
  ]),
  ...pageSteps("/dashboard/offertes", "Offertes", [
    {
      target: "new-quote-button",
      title: "Nieuwe offerte",
      description: "Klik hier om te starten -- kies een template (de inhoud staat dan al klaar) of begin leeg.",
    },
    {
      target: "offertes-search-filter",
      title: "Zoeken en filteren",
      description: "Zoek op klantnaam of zet meerdere statussen tegelijk aan (concept, verzonden, geaccepteerd, etc.).",
    },
    {
      target: "offertes-list",
      title: "Je offertes",
      description:
        "Elke offerte met werkelijke waarde en laatste wijziging, plus snelle acties: bekijken, bewerken, dupliceren, verwijderen.",
    },
  ]),
  ...pageSteps(
    "/dashboard/facturen",
    "Facturen",
    [
      {
        target: "new-invoice-button",
        title: "Nieuwe factuur",
        description: "Klik hier om een losse factuur te starten, zonder gekoppelde offerte.",
      },
      {
        target: "facturen-tabs",
        title: "Facturen & artikelen",
        description: "Wissel hier tussen je facturenlijst en je opgeslagen factuurartikelen (herbruikbare regels).",
      },
      {
        target: "facturen-list",
        title: "Je facturen",
        description: "Type (aanbetaling/slotfactuur/creditnota), status en bedrag van elke factuur op een rij.",
      },
    ],
    { adminOnly: true, invoicingOnly: true },
  ),
  ...pageSteps("/dashboard/klanten", "Klanten", [
    {
      target: "new-client-button",
      title: "Nieuwe klant",
      description:
        "Meestal niet nodig -- een klant wordt automatisch aangemaakt zodra je voor iemand nieuws een offerte maakt.",
    },
    {
      target: "klanten-list",
      title: "Je klantenbestand",
      description: "Aantal offertes, geaccepteerde waarde en klant-sinds-datum per klant, met notities en geschiedenis.",
    },
  ]),
  ...pageSteps("/dashboard/aanvragen", "Offerte-aanvragen", [
    {
      target: "aanvragen-list",
      title: "Zoeken en filteren",
      description:
        "Zoek op naam/e-mail of filter op status -- een oranje driehoekje betekent dat een aanvraag al langer dan 48 uur niet opgepakt is.",
    },
    {
      target: "aanvragen-results",
      title: "Omzetten naar offerte",
      description: "Elke aanvraag zet je met één klik om naar een echte, al gedeeltelijk ingevulde offerte.",
    },
  ]),
  ...pageSteps("/dashboard/templates", "Templates", [
    {
      target: "new-template-button",
      title: "Nieuw template",
      description: "Klik hier om te starten -- bouw 'm op met blokken, net als een offerte, maar herbruikbaar.",
    },
    {
      target: "templates-tabs",
      title: "Templates & blok-templates",
      description:
        "Wissel tussen je hele offerte-templates en losse blok-templates (bv. een vaste introtekst) voor sneller hergebruik.",
    },
  ]),
  ...pageSteps("/dashboard/arrangementen", "Arrangementen", [
    {
      target: "new-arrangement-button",
      title: "Nieuw arrangement",
      description:
        "Klik hier om te starten -- vaste, staffel- of seizoensprijs, met vrij samen te stellen tekst/categorieën/extra's/foto's.",
    },
    {
      target: "arrangementen-grid",
      title: "Je aanbod",
      description: "Al je arrangementen op een rij -- versleep de kaarten om de volgorde in het overzicht te wijzigen.",
    },
  ]),
  ...pageSteps(
    "/dashboard/statistieken",
    "Statistieken",
    [
      {
        target: "stats-revenue-tiles",
        title: "Omzet",
        description: "Omzet geaccepteerd en omzet gemist (geweigerd/verlopen), in één oogopslag.",
      },
      {
        target: "stats-pipeline-chart",
        title: "Pipeline",
        description:
          "Hoeveel offertes in elke status staan -- verderop ook een periode-vergelijker en templateprestaties.",
      },
    ],
    { adminOnly: true },
  ),
  ...pageSteps(
    "/dashboard/administratie",
    "Administratie",
    [
      {
        target: "administratie-summary",
        title: "Btw-rubrieken",
        description: "Rubriek 1a/1b/5a voor het gekozen kwartaal, rechtstreeks bruikbaar bij je aangifte.",
      },
      {
        target: "administratie-quarter-picker",
        title: "Kwartaal wisselen",
        description: "Blader door kwartalen/jaren, of exporteer het overzicht en de onderliggende facturen als CSV.",
      },
    ],
    { adminOnly: true, invoicingOnly: true },
  ),
  ...pageSteps(
    "/dashboard/instellingen",
    "Instellingen",
    [
      {
        target: "settings-organisatie",
        title: "Organisatie",
        description: "Bedrijfsgegevens, adres, contactgegevens en huisstijlkleuren stel je hier in.",
      },
      {
        target: "settings-team",
        title: "Team & rechten",
        description: "Nodig teamleden uit en beheer hun rol (Eigenaar, Admin, Teamlid, Alleen-lezen).",
      },
    ],
    { adminOnly: true },
  ),
];

export type TourPhase = "closed" | "intro" | "steps";

export function ProductTour({
  phase,
  stepIndex,
  steps,
  onStart,
  onSkip,
  onNext,
  onPrev,
  onClose,
}: {
  phase: TourPhase;
  stepIndex: number;
  steps: TourStep[];
  onStart: () => void;
  onSkip: () => void;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}) {
  const step = phase === "steps" ? steps[stepIndex] : null;
  const targetRect = useSpotlightRect(step ? `[data-faq-id="${step.target}"]` : null);

  if (phase === "closed" || (phase === "steps" && steps.length === 0)) return null;

  if (phase === "intro") {
    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-500/60 px-4">
        <div className="flex w-full max-w-md flex-col gap-4 rounded-brand-lg border border-ink-200/60 bg-white p-6 shadow-2xl">
          <div className="flex items-center gap-2">
            <Compass className="size-5 text-teal-600" />
            <h2 className="font-display text-lg font-semibold text-ink-500">Welkom bij Kwotio!</h2>
          </div>
          <p className="text-sm text-ink-400">
            Wil je een korte rondleiding door de app? We lopen samen elke pagina langs en laten precies zien wat je
            er kan doen.
          </p>
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={onSkip}>
              Rondleiding overslaan
            </Button>
            <Button size="sm" onClick={onStart}>
              Start rondleiding
            </Button>
          </div>
        </div>
      </div>,
      document.body,
    );
  }

  return (
    <SpotlightOverlay
      targetRect={targetRect}
      title={step!.title}
      description={step!.description}
      stepIndex={stepIndex}
      totalSteps={steps.length}
      onNext={onNext}
      onPrev={onPrev}
      onClose={onClose}
    />
  );
}
