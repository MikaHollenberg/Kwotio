"use client";

import { createPortal } from "react-dom";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSpotlightRect } from "./use-spotlight-rect";
import { SpotlightOverlay } from "./spotlight-overlay";

export type TourStep = {
  href: string;
  /** `data-faq-id`-waarde van een écht onderdeel op die pagina (dezelfde
   * markers als de FAQ-stappenplannen al gebruiken, zie faq-content.tsx) --
   * geen sidebar-navigatie-item meer. Dat laatste was op mobiel altijd
   * onzichtbaar (de desktop-Sidebar is daar `hidden`), dus de rondleiding
   * "deed niks" op de telefoon; door een écht stuk pagina-inhoud te
   * spotlighten werkt het overal hetzelfde én laat het meteen zien wat je
   * er kan doen, in plaats van alleen het menu-item aan te wijzen. */
  target: string;
  title: string;
  description: string;
  adminOnly?: boolean;
  invoicingOnly?: boolean;
};

/** Eén stap per hoofdpagina uit de sidebar-navigatie, in dezelfde volgorde.
 * De rondleiding navigeert daadwerkelijk naar elke pagina en spotlight't
 * daar een echt, betekenisvol onderdeel (zie `target` hierboven) -- Facturen/
 * Statistieken/Administratie/Instellingen zijn `adminOnly` en/of
 * `invoicingOnly`; de aanroeper (DashboardShell) filtert die eruit voor een
 * teamlid/alleen-lezen-rol of een organisatie zonder facturatie. */
export const ALL_TOUR_STEPS: TourStep[] = [
  {
    href: "/dashboard",
    target: "dashboard-kpis",
    title: "Overzicht",
    description:
      "Je startpagina. Bovenaan je belangrijkste cijfers deze maand: aantal offertes, conversieratio, gemiddelde doorlooptijd en je populairste pakket. Daaronder je eerstvolgende acties, aankomende events en recente activiteit.",
  },
  {
    href: "/dashboard/offertes",
    target: "new-quote-button",
    title: "Offertes",
    description:
      "Hier maak, bewerk en verstuur je al je offertes. Klik op 'Nieuwe offerte' om te starten -- kies een template (de inhoud staat dan al klaar) of begin leeg. Zoek, filter op status en exporteer de lijst als CSV.",
  },
  {
    href: "/dashboard/facturen",
    target: "new-invoice-button",
    title: "Facturen",
    description:
      "Zet een geaccepteerde offerte om in een factuur, of begin hier helemaal vanaf 0. Aanbetalingen, slotfacturen en online betalen via Mollie werken allemaal.",
    adminOnly: true,
    invoicingOnly: true,
  },
  {
    href: "/dashboard/klanten",
    target: "new-client-button",
    title: "Klanten",
    description:
      "Je klantenbestand: contactgegevens, notities en de offerte-geschiedenis per klant. Nieuwe klanten worden ook automatisch aangemaakt zodra je voor iemand nieuws een offerte maakt.",
  },
  {
    href: "/dashboard/aanvragen",
    target: "aanvragen-list",
    title: "Offerte-aanvragen",
    description:
      "Aanvragen die binnenkomen via je publieke offertepagina verschijnen hier vanzelf. Zet er met één klik een echte offerte van, of zoek en filter op status.",
  },
  {
    href: "/dashboard/templates",
    target: "new-template-button",
    title: "Templates",
    description:
      "Bouw herbruikbare offerte-templates, zodat je niet steeds van nul begint. Zet er eentje publiek zichtbaar om rechtstreeks aanvragen te ontvangen.",
  },
  {
    href: "/dashboard/arrangementen",
    target: "new-arrangement-button",
    title: "Arrangementen",
    description:
      "Je vaste aanbod, met staffel- of seizoensprijzen, eigen categorieën/tekst/extra's/foto's per arrangement en een optionele PDF. Voeg zo'n arrangement als kant-en-klaar blok toe aan een offerte.",
  },
  {
    href: "/dashboard/statistieken",
    target: "stats-revenue-tiles",
    title: "Statistieken",
    description: "Omzet geaccepteerd/gemist, conversieratio's per periode, populairste pakketten en templateprestaties.",
    adminOnly: true,
  },
  {
    href: "/dashboard/administratie",
    target: "administratie-summary",
    title: "Administratie",
    description:
      "Je btw-aangifte per kwartaal (rubriek 1a/1b/5a), met de onderliggende facturen en een CSV-export -- rechtstreeks bruikbaar bij je boekhouding.",
    adminOnly: true,
    invoicingOnly: true,
  },
  {
    href: "/dashboard/instellingen",
    target: "settings-organisatie",
    title: "Instellingen",
    description: "Bedrijfsgegevens, huisstijl, team, e-mailautomatisering en je publieke offertepagina beheer je hier.",
    adminOnly: true,
  },
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
