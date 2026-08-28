"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  LayoutTemplate,
  BarChart3,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { OfferioMark } from "@/components/brand/offerio-mark";
import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Overzicht", icon: LayoutDashboard },
  { href: "/dashboard/offertes", label: "Offertes", icon: FileText },
  { href: "/dashboard/klanten", label: "Klanten", icon: Users },
  { href: "/dashboard/templates", label: "Templates", icon: LayoutTemplate },
  { href: "/dashboard/statistieken", label: "Statistieken", icon: BarChart3 },
  { href: "/dashboard/instellingen", label: "Instellingen", icon: Settings },
];

export function Sidebar({
  showAdmin = false,
  logoUrl,
}: {
  showAdmin?: boolean;
  /** Horizontaal logo van de organisatie (organizations.logo_horizontal_url).
   * Altijd het horizontale logo hier, ongeacht de logo_preference van de
   * organisatie — die voorkeur geldt elders (offertepagina, PDF). Zonder
   * eigen logo valt terug op het Offerio-platformmerk, niet op een
   * specifieke klant-huisstijl. */
  logoUrl?: string | null;
}) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-ink-200/40 bg-white/60 px-4 py-6 lg:flex">
      <Link href="/dashboard" className="mb-8 px-2">
        {logoUrl ? <Logo logoUrl={logoUrl} height={32} priority /> : <OfferioMark size={32} />}
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === href
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-brand-sm px-3 py-2.5 text-sm font-medium text-ink-400 transition-colors duration-200 ease-brand hover:bg-sand-200 hover:text-ink-500",
                isActive && "bg-blue-500 text-white hover:bg-blue-500 hover:text-white",
              )}
            >
              <Icon className="size-4.5" strokeWidth={2} />
              {label}
            </Link>
          );
        })}
      </nav>

      {showAdmin && (
        <Link
          href="/admin"
          className="mb-3 flex items-center gap-3 rounded-brand-sm border border-ink-200/60 px-3 py-2.5 text-sm font-medium text-ink-500 transition-colors duration-200 ease-brand hover:bg-sand-200"
        >
          <ShieldCheck className="size-4.5" strokeWidth={2} />
          Hoofdaccount
        </Link>
      )}

      <div className="mt-auto rounded-brand-sm bg-sand-200 px-3 py-3 text-xs text-ink-400">
        Feest aan het Water
        <br />
        Caribbean Bar Uitgeest
      </div>
    </aside>
  );
}
