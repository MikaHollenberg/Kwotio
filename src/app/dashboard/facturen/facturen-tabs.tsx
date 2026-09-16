import Link from "next/link";
import { cn } from "@/lib/utils";

/** Tabs bovenaan de facturenlijst en de artikelen-lijst -- zelfde patroon
 * als TemplatesTabs (app/src/app/dashboard/templates/templates-tabs.tsx). */
export function FacturenTabs({ active }: { active: "facturen" | "artikelen" }) {
  const tabs = [
    { key: "facturen" as const, label: "Facturen", href: "/dashboard/facturen" },
    { key: "artikelen" as const, label: "Factuurartikelen", href: "/dashboard/facturen/artikelen" },
  ];

  return (
    <div className="flex w-fit gap-1 rounded-brand-sm bg-sand-200 p-1">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={cn(
            "rounded-[calc(var(--radius-brand-sm)_-_2px)] px-3 py-1.5 text-sm font-medium transition-colors",
            active === tab.key ? "bg-white text-ink-500 shadow-sm" : "text-ink-400 hover:text-ink-500",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
