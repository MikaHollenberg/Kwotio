"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  Inbox,
  LayoutTemplate,
  BarChart3,
  Settings,
  ShieldCheck,
  HelpCircle,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { KwotioMark } from "@/components/brand/kwotio-mark";
import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Overzicht", icon: LayoutDashboard },
  { href: "/dashboard/offertes", label: "Offertes", icon: FileText },
  { href: "/dashboard/klanten", label: "Klanten", icon: Users },
  { href: "/dashboard/aanvragen", label: "Offerte-aanvragen", icon: Inbox },
  { href: "/dashboard/templates", label: "Templates", icon: LayoutTemplate },
  { href: "/dashboard/statistieken", label: "Statistieken", icon: BarChart3, adminOnly: true },
  { href: "/dashboard/instellingen", label: "Instellingen", icon: Settings, adminOnly: true },
];

export function Sidebar({
  showAdmin = false,
  canManageOrg = false,
  logoUrl,
  organizationName,
  newRequestCount = 0,
}: {
  showAdmin?: boolean;
  /** Rol is owner/admin — bepaalt of Statistieken/Instellingen in de
   * navigatie getoond worden (teamlid/alleen-lezen mogen daar niet komen). */
  canManageOrg?: boolean;
  /** Horizontaal logo van de organisatie (organizations.logo_horizontal_url).
   * Altijd het horizontale logo hier, ongeacht de logo_preference van de
   * organisatie — die voorkeur geldt elders (offertepagina, PDF). Zonder
   * eigen logo valt terug op het Kwotio-platformmerk, niet op een
   * specifieke klant-huisstijl. */
  logoUrl?: string | null;
  /** organizations.brand_name — getoond onderin de sidebar. */
  organizationName?: string | null;
  /** Aantal offerte-aanvragen met status "nieuw" — badge naast dat nav-item. */
  newRequestCount?: number;
}) {
  const pathname = usePathname();
  const visibleNavItems = NAV_ITEMS.filter((item) => !item.adminOnly || canManageOrg);

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-ink-200/40 bg-white/60 px-4 py-6 lg:flex">
      <Link href="/dashboard" className="mb-8 px-2">
        {logoUrl ? <Logo logoUrl={logoUrl} height={32} priority /> : <KwotioMark size={32} />}
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {visibleNavItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === href
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              data-tour-id={href}
              className={cn(
                "flex items-center gap-3 rounded-brand-sm px-3 py-2.5 text-sm font-medium text-ink-400 transition-colors duration-200 ease-brand hover:bg-sand-200 hover:text-ink-500",
                isActive && "bg-blue-500 text-white hover:bg-blue-500 hover:text-white",
              )}
            >
              <Icon className="size-4.5" strokeWidth={2} />
              <span className="flex-1">{label}</span>
              {href === "/dashboard/aanvragen" && newRequestCount > 0 && (
                <span
                  className={cn(
                    "flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold",
                    isActive ? "bg-white/20 text-white" : "bg-orange-500 text-white",
                  )}
                >
                  {newRequestCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <Link
        href="/dashboard/faq"
        className={cn(
          "mb-3 flex items-center gap-3 rounded-brand-sm px-3 py-2.5 text-sm font-medium text-ink-400 transition-colors duration-200 ease-brand hover:bg-sand-200 hover:text-ink-500",
          pathname.startsWith("/dashboard/faq") && "bg-blue-500 text-white hover:bg-blue-500 hover:text-white",
        )}
      >
        <HelpCircle className="size-4.5" strokeWidth={2} />
        Help &amp; FAQ
      </Link>

      {showAdmin && (
        <Link
          href="/admin"
          className="mb-3 flex items-center gap-3 rounded-brand-sm border border-ink-200/60 px-3 py-2.5 text-sm font-medium text-ink-500 transition-colors duration-200 ease-brand hover:bg-sand-200"
        >
          <ShieldCheck className="size-4.5" strokeWidth={2} />
          Hoofdaccount
        </Link>
      )}

      <div className="mt-auto rounded-brand-sm bg-sand-200 px-3 py-3 text-xs font-medium text-ink-400">
        {organizationName ?? "Kwotio"}
      </div>
    </aside>
  );
}
