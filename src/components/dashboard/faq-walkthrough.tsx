"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useSpotlightRect } from "./use-spotlight-rect";
import { SpotlightOverlay } from "./spotlight-overlay";

export type FaqStep = {
  /** Pagina om naartoe te navigeren -- weglaten als de stap op de huidige
   * pagina blijft. */
  href?: string;
  /** CSS-selector van het element om te spotlighten (bijv. `[data-faq-id="..."]`).
   * Weglaten voor een puur informatieve stap (bijv. omdat het doelelement
   * pas bestaat zodra je zelf een specifieke offerte/template opent) -- die
   * toont dan een gecentreerd kaartje i.p.v. een spotlight. */
  selector?: string;
  title: string;
  description: string;
};

/** Resultaat van een (eventueel asynchrone) voorbereiding vóór de eerste
 * stap -- bijv. een tijdelijke voorbeeldofferte aanmaken zodat de rest van
 * het stappenplan een écht bestaande offerte-editor kan spotlighten.
 * `cleanup` wordt aangeroepen zodra deze rondleiding sluit of afrondt. */
export type FaqWalkthroughPlan = { steps: FaqStep[]; cleanup?: () => void | Promise<void> };
type StartInput = FaqStep[] | (() => Promise<FaqWalkthroughPlan>);

type WalkthroughState = { steps: FaqStep[]; stepIndex: number; cleanup?: () => void | Promise<void> } | null;

const FaqWalkthroughContext = createContext<{ start: (input: StartInput) => void; preparing: boolean } | null>(null);

export function useFaqWalkthrough() {
  const ctx = useContext(FaqWalkthroughContext);
  if (!ctx) throw new Error("useFaqWalkthrough moet binnen FaqWalkthroughProvider gebruikt worden.");
  return ctx;
}

/**
 * Generieke "laat zien"-stappenplannen vanuit de FAQ-pagina -- zelfde
 * spotlight-techniek als de onboarding-rondleiding (ProductTour), maar
 * losstaand: geen intro-scherm, geen "gezien"-registratie, gewoon meteen
 * stap 1 tonen zodra een FAQ-item op "Laat zien" geklikt wordt. Leeft op
 * dit niveau (rond `children` in DashboardShell) zodat de stappen kunnen
 * blijven doorlopen terwijl er daadwerkelijk tussen pagina's genavigeerd
 * wordt (de FAQ-pagina zelf is maar het startpunt, niet de houder van de
 * state).
 */
export function FaqWalkthroughProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [walkthrough, setWalkthrough] = useState<WalkthroughState>(null);
  const [preparing, setPreparing] = useState(false);

  function begin(steps: FaqStep[], cleanup?: () => void | Promise<void>) {
    if (steps.length === 0) return;
    setWalkthrough({ steps, stepIndex: 0, cleanup });
    if (steps[0].href) router.push(steps[0].href);
  }

  async function start(input: StartInput) {
    if (Array.isArray(input)) {
      begin(input);
      return;
    }
    // Sommige stappenplannen hebben eerst een tijdelijke voorbeeldofferte/
    // -template/-aanvraag nodig (bijv. om de echte offerte-editor te kunnen
    // spotlighten) -- dat kost een netwerk-rondje, vandaar `preparing`.
    setPreparing(true);
    try {
      const { steps, cleanup } = await input();
      begin(steps, cleanup);
    } finally {
      setPreparing(false);
    }
  }

  // `router.push` bewust NIET binnen een setState-updater aanroepen -- dat
  // bleek onbetrouwbaar (React kan de updater meerdere keren of vertraagd
  // aanroepen). Gebruikt i.p.v. daarvan de `walkthrough` uit de sluiting van
  // deze render, zelfde opzet als de al bewezen werkende onboarding-
  // rondleiding in dashboard-shell.tsx.
  function goTo(index: number) {
    if (!walkthrough) return;
    const clamped = Math.max(0, Math.min(walkthrough.steps.length - 1, index));
    const nextHref = walkthrough.steps[clamped].href;
    if (nextHref) router.push(nextHref);
    setWalkthrough({ ...walkthrough, stepIndex: clamped });
  }

  function close() {
    if (walkthrough?.cleanup) void walkthrough.cleanup();
    setWalkthrough(null);
  }

  return (
    <FaqWalkthroughContext.Provider value={{ start, preparing }}>
      {children}
      {walkthrough && (
        <FaqWalkthroughOverlay
          step={walkthrough.steps[walkthrough.stepIndex]}
          stepIndex={walkthrough.stepIndex}
          totalSteps={walkthrough.steps.length}
          onNext={() => {
            if (walkthrough.stepIndex >= walkthrough.steps.length - 1) close();
            else goTo(walkthrough.stepIndex + 1);
          }}
          onPrev={() => goTo(walkthrough.stepIndex - 1)}
          onClose={close}
        />
      )}
    </FaqWalkthroughContext.Provider>
  );
}

function FaqWalkthroughOverlay({
  step,
  stepIndex,
  totalSteps,
  onNext,
  onPrev,
  onClose,
}: {
  step: FaqStep;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}) {
  const targetRect = useSpotlightRect(step.selector ?? null);

  return (
    <SpotlightOverlay
      targetRect={targetRect}
      title={step.title}
      description={step.description}
      stepIndex={stepIndex}
      totalSteps={totalSteps}
      onNext={onNext}
      onPrev={onPrev}
      onClose={onClose}
    />
  );
}
