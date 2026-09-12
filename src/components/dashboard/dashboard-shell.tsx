"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Topbar } from "@/components/dashboard/topbar";
import { ProductTour, ALL_TOUR_STEPS, type TourPhase } from "@/components/dashboard/product-tour";
import { FaqWalkthroughProvider } from "@/components/dashboard/faq-walkthrough";
import { markTourSeen } from "@/app/dashboard/tour-actions";
import { PRIVACYBELEID_URL } from "@/lib/legal";

const TITLES: Record<string, string> = {
  "/dashboard": "Overzicht",
  "/dashboard/offertes": "Offertes",
  "/dashboard/klanten": "Klanten",
  "/dashboard/aanvragen": "Offerte-aanvragen",
  "/dashboard/templates": "Templates",
  "/dashboard/statistieken": "Statistieken",
  "/dashboard/instellingen": "Instellingen",
};

function titleFor(pathname: string, fallback: string) {
  if (TITLES[pathname]) return TITLES[pathname];
  const base = "/" + pathname.split("/").slice(1, 3).join("/");
  return TITLES[base] ?? fallback;
}

export function DashboardShell({
  children,
  fullName,
  email,
  showAdmin = false,
  canManageOrg = false,
  organizationName,
  termsUrl,
  newRequestCount = 0,
  tourSeen = true,
}: {
  children: React.ReactNode;
  fullName: string | null;
  email: string;
  showAdmin?: boolean;
  /** Rol is owner/admin -- bepaalt zowel welke nav-items zichtbaar zijn als
   * welke rondleiding-stappen meegenomen worden (een teamlid/alleen-lezen
   * mag niet naar Statistieken/Instellingen, dus die stappen slaan we over). */
  canManageOrg?: boolean;
  organizationName?: string | null;
  termsUrl?: string | null;
  newRequestCount?: number;
  /** profiles.onboarding_tour_seen_at !== null -- stuurt alleen de
   * automatische eerste-keer-prompt aan (zie ProductTour). */
  tourSeen?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const pageTitle = titleFor(pathname, organizationName ?? "Kwotio");

  const tourSteps = useMemo(() => ALL_TOUR_STEPS.filter((s) => !s.adminOnly || canManageOrg), [canManageOrg]);
  const [tourPhase, setTourPhase] = useState<TourPhase>(() => (tourSeen ? "closed" : "intro"));
  const [tourStep, setTourStep] = useState(0);

  function closeTour(markSeen: boolean) {
    setTourPhase("closed");
    if (markSeen) void markTourSeen();
  }

  function goToStep(index: number) {
    setTourStep(index);
    router.push(tourSteps[index].href);
  }

  // Badge in de titel van het browsertabblad ("(2) Offertes") zodra er
  // nieuwe, nog niet opgepakte aanvragen zijn -- zo valt het ook op als het
  // tabblad niet actief is, zonder dat je steeds hoeft te controleren. Next
  // zet de <title>-tag na hydratie soms terug naar de statische metadata-
  // waarde, dus een eenmalige document.title-toewijzing wordt anders
  // meteen weer overschreven -- een MutationObserver op de title-tag dwingt
  // de badge steeds opnieuw af zodra iets anders 'm probeert te wijzigen.
  useEffect(() => {
    const badgedTitle = newRequestCount > 0 ? `(${newRequestCount}) ${pageTitle}` : pageTitle;

    function applyBadge() {
      if (document.title !== badgedTitle) document.title = badgedTitle;
    }
    applyBadge();

    const titleEl = document.querySelector("title");
    if (!titleEl) return;
    const observer = new MutationObserver(applyBadge);
    observer.observe(titleEl, { childList: true, characterData: true, subtree: true });
    return () => observer.disconnect();
  }, [pageTitle, newRequestCount]);

  return (
    <>
      <Topbar
        title={pageTitle}
        fullName={fullName}
        email={email}
        showAdmin={showAdmin}
        canManageOrg={canManageOrg}
        newRequestCount={newRequestCount}
        onStartTour={() => {
          setTourStep(0);
          setTourPhase("intro");
        }}
      />
      <FaqWalkthroughProvider>
        <main className="min-w-0 flex-1 px-6 py-8 lg:px-8">{children}</main>
      </FaqWalkthroughProvider>
      <footer className="px-6 py-4 text-center text-xs text-ink-300 lg:px-8">
        {termsUrl && (
          <>
            <a href={termsUrl} target="_blank" rel="noopener noreferrer" className="hover:text-ink-400 hover:underline">
              Algemene voorwaarden{organizationName ? ` van ${organizationName}` : ""}
            </a>
            {" · "}
          </>
        )}
        <a href={PRIVACYBELEID_URL} target="_blank" rel="noopener noreferrer" className="hover:text-ink-400 hover:underline">
          Privacybeleid
        </a>
      </footer>

      <ProductTour
        phase={tourPhase}
        stepIndex={tourStep}
        steps={tourSteps}
        onStart={() => {
          setTourPhase("steps");
          goToStep(0);
        }}
        onSkip={() => closeTour(true)}
        onNext={() => {
          if (tourStep >= tourSteps.length - 1) closeTour(true);
          else goToStep(tourStep + 1);
        }}
        onPrev={() => goToStep(Math.max(0, tourStep - 1))}
        onClose={() => closeTour(true)}
      />
    </>
  );
}
