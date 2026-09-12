"use client";

import { type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { X, ArrowRight, ArrowLeft, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSpotlightRect, getCalloutPosition } from "./use-spotlight-rect";

export type TourStep = { href: string; title: string; description: string; adminOnly?: boolean };

/** Eén stap per hoofdpagina uit de sidebar-navigatie, in dezelfde volgorde --
 * de rondleiding navigeert daadwerkelijk naar elke pagina (i.p.v. alleen een
 * los venster te tonen) en spotlight't daarbij het bijbehorende nav-item
 * (via `[data-tour-id]` op de Sidebar-links, zie sidebar.tsx). Statistieken/
 * Instellingen zijn `adminOnly` -- de aanroeper (DashboardShell) filtert die
 * eruit voor een teamlid/alleen-lezen-rol, die daar toch niet mag komen. */
export const ALL_TOUR_STEPS: TourStep[] = [
  {
    href: "/dashboard",
    title: "Overzicht",
    description:
      "Je startpagina: offertes deze maand, aankomende events en je recente activiteit in één oogopslag.",
  },
  {
    href: "/dashboard/offertes",
    title: "Offertes",
    description: "Hier maak, bewerk en verstuur je al je offertes. Zoek, filter op status en exporteer als CSV.",
  },
  {
    href: "/dashboard/klanten",
    title: "Klanten",
    description: "Je klantenbestand: contactgegevens, notities en de offerte-geschiedenis per klant.",
  },
  {
    href: "/dashboard/aanvragen",
    title: "Offerte-aanvragen",
    description:
      "Aanvragen die binnenkomen via je publieke offertepagina. Zet ze om naar een echte offerte of markeer ze als afgehandeld.",
  },
  {
    href: "/dashboard/templates",
    title: "Templates",
    description:
      "Bouw herbruikbare offerte-templates, zodat je niet steeds van nul begint. Zet er eentje publiek zichtbaar om aanvragen te ontvangen.",
  },
  {
    href: "/dashboard/statistieken",
    title: "Statistieken",
    description: "Conversieratio's, omzet per periode, populairste pakketten en meer.",
    adminOnly: true,
  },
  {
    href: "/dashboard/instellingen",
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
  const targetRect = useSpotlightRect(step ? `[data-tour-id="${step.href}"]` : null);

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

  const isLast = stepIndex === steps.length - 1;

  const calloutStyle: CSSProperties | undefined = targetRect
    ? { position: "fixed", ...getCalloutPosition(targetRect) }
    : undefined;

  return createPortal(
    <div className="fixed inset-0 z-50">
      {targetRect ? (
        <div
          aria-hidden
          className="pointer-events-none fixed rounded-brand-sm transition-all duration-300 ease-brand"
          style={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            boxShadow: "0 0 0 3px #14b8a6, 0 0 0 9999px rgba(15, 23, 32, 0.65)",
          }}
        />
      ) : (
        <div aria-hidden className="pointer-events-none fixed inset-0 bg-ink-500/60" />
      )}

      <div
        className={cn(
          "flex flex-col gap-3 rounded-brand-lg border border-ink-200/60 bg-white p-5 shadow-2xl",
          targetRect ? "w-80" : "fixed inset-0 m-auto h-fit w-full max-w-md",
        )}
        style={calloutStyle}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-ink-400">
              Stap {stepIndex + 1} van {steps.length}
            </p>
            <h2 className="font-display text-base font-semibold text-ink-500">{step!.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-7 shrink-0 items-center justify-center rounded-brand-sm text-ink-400 hover:bg-sand-200"
          >
            <X className="size-4" />
          </button>
        </div>
        <p className="text-sm text-ink-400">{step!.description}</p>

        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <span key={i} className={cn("size-1.5 rounded-full", i === stepIndex ? "bg-teal-600" : "bg-ink-200")} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {stepIndex > 0 && (
              <Button variant="ghost" size="sm" onClick={onPrev}>
                <ArrowLeft className="size-3.5" />
                Vorige
              </Button>
            )}
            <Button size="sm" onClick={onNext}>
              {isLast ? "Klaar" : "Volgende"}
              {!isLast && <ArrowRight className="size-3.5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
