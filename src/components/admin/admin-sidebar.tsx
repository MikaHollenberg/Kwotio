"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Building2, ArrowLeft, ShieldCheck } from "lucide-react";
import { KwotioMark } from "@/components/brand/kwotio-mark";
import { APP_NAME } from "@/lib/app-config";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Statistieken", icon: BarChart3 },
  { href: "/admin/organisaties", label: "Organisaties", icon: Building2 },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-ink-200/40 bg-white/60 px-4 py-6 lg:flex">
      <div className="mb-8 flex items-center gap-2 px-2">
        <KwotioMark size={28} />
        <span className="font-display text-lg font-semibold text-ink-500">{APP_NAME}</span>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-brand-sm bg-ink-500 px-3 py-2 text-xs font-semibold text-white">
        <ShieldCheck className="size-4" />
        Hoofdaccount
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/admin" ? pathname === href : pathname.startsWith(href);
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

      <Link
        href="/dashboard"
        className="flex items-center gap-3 rounded-brand-sm px-3 py-2.5 text-sm font-medium text-ink-400 transition-colors duration-200 ease-brand hover:bg-sand-200 hover:text-ink-500"
      >
        <ArrowLeft className="size-4.5" strokeWidth={2} />
        Terug naar dashboard
      </Link>
    </aside>
  );
}
