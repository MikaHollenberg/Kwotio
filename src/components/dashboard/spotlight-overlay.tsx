"use client";

import { type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCalloutPosition } from "./use-spotlight-rect";

/**
 * Gedeelde spotlight-overlay, gebruikt door zowel de onboarding-rondleiding
 * (ProductTour) als de FAQ-stappenplannen (FaqWalkthrough) -- voorheen twee
 * bijna identieke kopieën van dezelfde JSX.
 *
 * Toont op desktop een los positioneerbaar uitlegwolkje naast het
 * gespotlighte element (`getCalloutPosition`). Op mobiel (< `sm`) werkt die
 * naast-positionering niet betrouwbaar (een smal scherm laat vrijwel nooit
 * genoeg ruimte over, zie hard geleerde les in HANDOVER) -- daar wordt het
 * wolkje altijd een vast onderin-vastgezet "bottom sheet"-paneel, met de
 * spotlight-cutout gewoon op zijn eigen plek erboven. Twee losse renders
 * (`hidden sm:flex` / `sm:hidden`), geen JS-breakpoint-detectie: voorkomt
 * een hydration-mismatch en sluit aan op hoe de rest van de app responsive
 * varianten al oplost (bijv. offertes-table.tsx's tabel/kaart-wissel).
 */
export function SpotlightOverlay({
  targetRect,
  title,
  description,
  stepIndex,
  totalSteps,
  onNext,
  onPrev,
  onClose,
}: {
  targetRect: DOMRect | null;
  title: string;
  description: string;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}) {
  const isLast = stepIndex === totalSteps - 1;

  const calloutStyle: CSSProperties | undefined = targetRect
    ? { position: "fixed", ...getCalloutPosition(targetRect) }
    : undefined;

  const body: ReactNode = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-ink-400">
            Stap {stepIndex + 1} van {totalSteps}
          </p>
          <h2 className="font-display text-base font-semibold text-ink-500">{title}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex size-7 shrink-0 items-center justify-center rounded-brand-sm text-ink-400 hover:bg-sand-200"
        >
          <X className="size-4" />
        </button>
      </div>
      <p className="text-sm text-ink-400">{description}</p>

      {/* Dunne voortgangsbalk i.p.v. een stip per stap -- bij tientallen
          stappen (elke pagina heeft nu een nav- + 2-3 content-stappen, zie
          product-tour.tsx) paste een stip-per-stap-rij niet meer in de
          kaart en duwde de knoppen zichtbaar erbuiten. Een balk schaalt
          naar elk aantal stappen zonder ooit over te lopen. */}
      <div className="h-1 w-full overflow-hidden rounded-full bg-ink-100">
        <div
          className="h-full rounded-full bg-teal-600 transition-all duration-300 ease-brand"
          style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
        />
      </div>

      <div className="flex items-center justify-end gap-2">
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
    </>
  );

  return createPortal(
    <div className="fixed inset-0 z-50">
      {targetRect ? (
        <>
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
          {/* Zachte, ademende gloedring rond de spotlight zelf (Kwotio Motion
              Concepts #19) -- los van de bovenstaande vaste rand, die de
              cutout scherp begrenst. */}
          <div
            aria-hidden
            className="kw-ring-pulse pointer-events-none fixed rounded-brand-sm border-2 border-teal-400 transition-all duration-300 ease-brand"
            style={{
              top: targetRect.top - 6,
              left: targetRect.left - 6,
              width: targetRect.width + 12,
              height: targetRect.height + 12,
            }}
          />
        </>
      ) : (
        <div aria-hidden className="pointer-events-none fixed inset-0 bg-ink-500/60" />
      )}

      {/* Desktop (>= sm): naast het doelelement, of gecentreerd zonder doel. */}
      <div
        className={cn(
          "hidden sm:flex sm:flex-col sm:gap-3 rounded-brand-lg border border-ink-200/60 bg-white p-5 shadow-2xl",
          targetRect ? "sm:w-80" : "sm:fixed sm:inset-0 sm:m-auto sm:h-fit sm:w-full sm:max-w-md",
        )}
        style={calloutStyle}
      >
        {body}
      </div>

      {/* Mobiel (< sm): altijd een onderin-vastgezet paneel -- de naast-
          positionering hierboven past bijna nooit op een smal scherm (zie
          component-comment). De spotlight-cutout blijft gewoon op zijn eigen
          plek zichtbaar boven dit paneel. */}
      <div
        className="fixed inset-x-0 bottom-0 z-10 flex max-h-[70vh] flex-col gap-3 overflow-y-auto rounded-t-brand-lg border-t border-ink-200/60 bg-white p-5 shadow-2xl sm:hidden"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      >
        {body}
      </div>
    </div>,
    document.body,
  );
}
