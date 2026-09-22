import type { Metadata, Viewport } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/dashboard/sidebar";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { TourProvider } from "@/components/dashboard/tour-context";
import { InstallAppBanner } from "@/components/dashboard/install-app-banner";

// PWA-installatie is bewust alleen hier gekoppeld (dit segment zit al achter
// de hierboven staande login-check) — nooit op de publieke klant-facing
// pagina's (/offerte, /offertes, /embed) of het inlogscherm. `icons.icon`
// wordt hier expliciet herhaald: Next.js' metadata-merge is shallow, dus
// zonder deze regel zou het root-favicon (icoon-zon.png) hier vervangen
// worden door alléén het apple-touch-icon i.p.v. ernaast te bestaan.
export const metadata: Metadata = {
  manifest: "/manifest.json",
  icons: { icon: "/brand/icoon-zon.png", apple: "/apple-touch-icon.png" },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Kwotio" },
};

// maximumScale/userScalable vastgezet op verzoek van de gebruiker: mobiel
// Safari onthoudt een pinch-zoom-niveau tussen client-side navigaties binnen
// dezelfde tab, waardoor een prima passende pagina er na eerder inzoomen
// opeens "afgesneden" uitziet (live gemeld en herleid tijdens deze sessie).
// Bewust alleen hier (dashboard, bureaupersoneel) — de publieke
// klant-facing pagina's (/offerte, /offertes) blijven vrij zoombaar, o.a.
// voor foto's/contracttekst.
export const viewport: Viewport = {
  themeColor: "#fbf6ec",
  maximumScale: 1,
  userScalable: false,
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, role, is_super_admin, organization_id, onboarding_tour_seen_at")
    .eq("id", user.id)
    .single();
  const canManageOrg = profile?.role === "owner" || profile?.role === "admin";

  const [{ data: organization }, { count: newRequestCount }] = await Promise.all([
    profile
      ? supabase
          .from("organizations")
          .select("logo_horizontal_url, brand_name, terms_url")
          .eq("id", profile.organization_id)
          .single()
      : Promise.resolve({ data: null }),
    profile
      ? supabase
          .from("quote_requests")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", profile.organization_id)
          .eq("status", "nieuw")
      : Promise.resolve({ count: 0 }),
  ]);

  return (
    <TourProvider canManageOrg={canManageOrg} tourSeen={Boolean(profile?.onboarding_tour_seen_at)}>
      {/* React 19 hoist't losse <meta>-tags overal in de boom naar <head> —
          nodig naast appleWebApp.capable hierboven: sommige oudere iOS-Safari-
          versies herkennen alleen de legacy apple-*-naam, niet de standaard
          "mobile-web-app-capable" die Next.js zelf al genereert. */}
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <InstallAppBanner />
      <div className="flex min-h-screen bg-sand-100">
        <Sidebar
          showAdmin={profile?.is_super_admin ?? false}
          canManageOrg={canManageOrg}
          logoUrl={organization?.logo_horizontal_url}
          organizationName={organization?.brand_name}
          newRequestCount={newRequestCount ?? 0}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardShell
            fullName={profile?.full_name ?? null}
            email={profile?.email ?? user.email ?? ""}
            showAdmin={profile?.is_super_admin ?? false}
            canManageOrg={canManageOrg}
            organizationName={organization?.brand_name ?? null}
            termsUrl={organization?.terms_url ?? null}
            newRequestCount={newRequestCount ?? 0}
          >
            {children}
          </DashboardShell>
        </div>
      </div>
    </TourProvider>
  );
}
