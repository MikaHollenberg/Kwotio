"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Topbar } from "@/components/dashboard/topbar";
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
  organizationName,
  termsUrl,
  newRequestCount = 0,
}: {
  children: React.ReactNode;
  fullName: string | null;
  email: string;
  showAdmin?: boolean;
  organizationName?: string | null;
  termsUrl?: string | null;
  newRequestCount?: number;
}) {
  const pathname = usePathname();
  const pageTitle = titleFor(pathname, organizationName ?? "Kwotio");

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
        newRequestCount={newRequestCount}
      />
      <main className="min-w-0 flex-1 px-6 py-8 lg:px-8">{children}</main>
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
    </>
  );
}
