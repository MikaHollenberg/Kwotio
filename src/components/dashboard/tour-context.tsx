"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ALL_TOUR_STEPS, type TourPhase, type TourStep } from "./product-tour";
import { markTourSeen } from "@/app/dashboard/tour-actions";

type TourContextValue = {
  phase: TourPhase;
  stepIndex: number;
  steps: TourStep[];
  startTour: () => void;
  beginSteps: () => void;
  closeTour: (markSeen: boolean) => void;
  goToStep: (index: number) => void;
};

const TourContext = createContext<TourContextValue | null>(null);

/**
 * Deelt de rondleiding-status tussen Sidebar/MobileNav (de knop, naast
 * "Help & FAQ") en DashboardShell (rendert de eigenlijke <ProductTour>-
 * overlay) -- die twee zijn broers/zussen in app/dashboard/layout.tsx, geen
 * ouder/kind, dus een gedeelde context i.p.v. prop-drilling via Topbar
 * (waar de knop hiervoor stond).
 */
export function TourProvider({
  children,
  canManageOrg,
  tourSeen,
}: {
  children: React.ReactNode;
  /** Rol is owner/admin -- stappen naar Statistieken/Instellingen slaan we
   * over voor een teamlid/alleen-lezen, zelfde reden als elders. */
  canManageOrg: boolean;
  /** profiles.onboarding_tour_seen_at !== null -- stuurt alleen de
   * automatische eerste-keer-prompt aan. */
  tourSeen: boolean;
}) {
  const router = useRouter();
  const steps = useMemo(() => ALL_TOUR_STEPS.filter((s) => !s.adminOnly || canManageOrg), [canManageOrg]);
  const [phase, setPhase] = useState<TourPhase>(() => (tourSeen ? "closed" : "intro"));
  const [stepIndex, setStepIndex] = useState(0);

  function goToStep(index: number) {
    setStepIndex(index);
    router.push(steps[index].href);
  }

  function closeTour(markSeen: boolean) {
    setPhase("closed");
    if (markSeen) void markTourSeen();
  }

  function startTour() {
    setStepIndex(0);
    setPhase("intro");
  }

  function beginSteps() {
    setPhase("steps");
    goToStep(0);
  }

  return (
    <TourContext.Provider value={{ phase, stepIndex, steps, startTour, beginSteps, closeTour, goToStep }}>
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used within a TourProvider");
  return ctx;
}
