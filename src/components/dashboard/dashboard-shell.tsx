"use client";

import { usePathname } from "next/navigation";
import { Topbar } from "@/components/dashboard/topbar";
import { PRIVACYBELEID_URL } from "@/lib/legal";

const TITLES: Record<string, string> = {
  "/dashboard": "Overzicht",
  "/dashboard/offertes": "Offertes",
  "/dashboard/klanten": "Klanten",
  "/dashboard/templates": "Templates",
  "/dashboard/statistieken": "Statistieken",
  "/dashboard/instellingen": "Instellingen",
};

function titleFor(pathname: string) {
  if (TITLES[pathname]) return TITLES[pathname];
  const base = "/" + pathname.split("/").slice(1, 3).join("/");
  return TITLES[base] ?? "Caribbean Bar Uitgeest";
}

export function DashboardShell({
  children,
  fullName,
  email,
  showAdmin = false,
  organizationName,
  termsUrl,
}: {
  children: React.ReactNode;
  fullName: string | null;
  email: string;
  showAdmin?: boolean;
  organizationName?: string | null;
  termsUrl?: string | null;
}) {
  const pathname = usePathname();

  return (
    <>
      <Topbar title={titleFor(pathname)} fullName={fullName} email={email} showAdmin={showAdmin} />
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
