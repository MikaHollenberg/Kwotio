import Link from "next/link";
import { cn } from "@/lib/utils";

/** Tabs bovenaan de twee templates-overzichtspagina's — bewust géén
 * gedeelde layout.tsx, want de bewerk-/aanmaakschermen eronder
 * (/nieuw, /[id], /blokken/nieuw, /blokken/[id]) hebben al hun eigen
 * kop/terug-navigatie en horen deze tabs niet te tonen. */
export function TemplatesTabs({ active }: { active: "offertes" | "blokken" }) {
  const tabs = [
    { key: "offertes" as const, label: "Offerte-templates", href: "/dashboard/templates" },
    { key: "blokken" as const, label: "Blok-templates", href: "/dashboard/templates/blokken" },
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
