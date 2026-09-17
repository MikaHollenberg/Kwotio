"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
  Compass,
  Receipt,
  Landmark,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { KwotioMark } from "@/components/brand/kwotio-mark";
import { useTour } from "./tour-context";
import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Overzicht", icon: LayoutDashboard },
  { href: "/dashboard/offertes", label: "Offertes", icon: FileText },
  { href: "/dashboard/facturen", label: "Facturen", icon: Receipt },
  { href: "/dashboard/klanten", label: "Klanten", icon: Users },
  { href: "/dashboard/aanvragen", label: "Offerte-aanvragen", icon: Inbox },
  { href: "/dashboard/templates", label: "Templates", icon: LayoutTemplate },
  { href: "/dashboard/statistieken", label: "Statistieken", icon: BarChart3, adminOnly: true },
  { href: "/dashboard/administratie", label: "Administratie", icon: Landmark, adminOnly: true },
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
  const { startTour } = useTour();
  const visibleNavItems = NAV_ITEMS.filter((item) => !item.adminOnly || canManageOrg);

  const navRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());
  const [pill, setPill] = useState<{ top: number; height: number } | null>(null);

  const activeHref = visibleNavItems.find(({ href }) => (href === "/dashboard" ? pathname === href : pathname.startsWith(href)))?.href;

  useEffect(() => {
    const navEl = navRef.current;
    const activeEl = activeHref ? itemRefs.current.get(activeHref) : null;
    if (!navEl || !activeEl) {
      setPill(null);
      return;
    }
    setPill({ top: activeEl.offsetTop, height: activeEl.offsetHeight });
  }, [activeHref]);

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-ink-200/40 bg-white/60 px-4 py-6 lg:flex">
      <Link href="/dashboard" className="mb-8 px-2">
        {logoUrl ? <Logo logoUrl={logoUrl} height={32} /> : <KwotioMark size={32} />}
      </Link>

      <nav ref={navRef} className="relative flex flex-1 flex-col gap-1">
        {/* Levende pil-achtergrond die meeglijdt naar het actieve item i.p.v.
            dat de kleur instant verspringt (Kwotio Motion Concepts #6). */}
        {pill && (
          <div
            aria-hidden
            className="absolute inset-x-0 z-0 rounded-brand-sm bg-blue-500 transition-all duration-[400ms] ease-brand"
            style={{ top: pill.top, height: pill.height }}
          />
        )}
        {visibleNavItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === activeHref;

          return (
            <Link
              key={href}
              href={href}
              data-tour-id={href}
              ref={(el) => {
                if (el) itemRefs.current.set(href, el);
                else itemRefs.current.delete(href);
              }}
              className={cn(
                "relative z-10 flex items-center gap-3 rounded-brand-sm px-3 py-2.5 text-sm font-medium text-ink-400 transition-colors duration-200 ease-brand hover:text-ink-500",
                isActive ? "text-white hover:text-white" : "hover:bg-sand-200",
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
          "flex items-center gap-3 rounded-brand-sm px-3 py-2.5 text-sm font-medium text-ink-400 transition-colors duration-200 ease-brand hover:bg-sand-200 hover:text-ink-500",
          pathname.startsWith("/dashboard/faq") && "bg-blue-500 text-white hover:bg-blue-500 hover:text-white",
        )}
      >
        <HelpCircle className="size-4.5" strokeWidth={2} />
        Help &amp; FAQ
      </Link>
      <button
        type="button"
        onClick={startTour}
        data-faq-id="restart-tour-button"
        className="mb-3 flex items-center gap-3 rounded-brand-sm px-3 py-2.5 text-left text-sm font-medium text-ink-400 transition-colors duration-200 ease-brand hover:bg-sand-200 hover:text-ink-500"
      >
        <Compass className="size-4.5" strokeWidth={2} />
        Rondleiding
      </button>

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
