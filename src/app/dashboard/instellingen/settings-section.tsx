"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Eén inklapbare categorie op de Instellingen-pagina (Fase 16-herontwerp:
 * 9 losse, altijd-open kaarten werden een ongeorganiseerd, heel lang
 * scrollende pagina -- dit groepeert ze in 7 categorieën die je los open-
 * en dichtklapt). De animatie is een `grid-template-rows: 0fr -> 1fr`-
 * overgang (`.kw-accordion` in globals.css) i.p.v. een vaste max-height,
 * zodat elke categorie -- ongeacht hoeveel velden erin zitten -- vloeiend
 * naar zijn eigen, echte hoogte animeert.
 *
 * Luistert op het `kw:reveal`-event (gedispatcht door useSpotlightRect
 * zodra een FAQ-stappenplan een nieuw doelelement gaat spotlighten): als
 * dat doelelement een afstammeling van déze sectie is, klapt de sectie
 * zichzelf open. Zonder dit zou een stappenplan dat een veld dieper in een
 * dichtgeklapte categorie spotlight (bijv. "Publieke link" of "Nieuw
 * teamlid uitnodigen") een spotlight-ring om een onzichtbaar, hoogte-0
 * element tonen -- de sectie zelf blijft daarbij ontkoppeld van de FAQ-
 * module, die weet niets van accordions af.
 */
export function SettingsSection({
  icon,
  title,
  summary,
  defaultOpen = false,
  faqId,
  children,
  style,
}: {
  /** Het complete, al gerenderde icoon-vlakje (incl. gekleurde achtergrond,
   * bijv. `<div className="flex size-10 items-center justify-center
   * rounded-brand-sm bg-blue-50 text-blue-600"><Building2
   * className="size-5" /></div>`), NIET het component zelf -- deze sectie
   * is een Client Component en `page.tsx` (die 'm aanroept) een Server
   * Component; een kale componentreferentie (bijv. `icon={Building2}`) is
   * geen platte, serialiseerbare data over die grens en crasht ("Only
   * plain objects can be passed to Client Components..."), een al
   * gerenderd element wél. */
  icon: ReactNode;
  title: string;
  summary: string;
  defaultOpen?: boolean;
  /** Voor een FAQ-stappenplan dat deze hele categorie spotlight (bijv.
   * "settings-facturatie") -- staat op de headerknop, die altijd zichtbaar
   * is, open of dicht. */
  faqId?: string;
  children: ReactNode;
  style?: CSSProperties;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleReveal(e: Event) {
      const selector = (e as CustomEvent<{ selector: string }>).detail?.selector;
      if (!selector || !rootRef.current) return;
      if (rootRef.current.querySelector(selector)) setOpen(true);
    }
    window.addEventListener("kw:reveal", handleReveal);
    return () => window.removeEventListener("kw:reveal", handleReveal);
  }, []);

  return (
    <div
      ref={rootRef}
      className="kw-page-enter overflow-hidden rounded-brand-lg border border-ink-200/40 bg-white/70 shadow-[0_1px_2px_rgba(30,46,56,0.04)] backdrop-blur-sm"
      style={style}
    >
      <button
        type="button"
        data-faq-id={faqId}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3.5 px-5 py-4 text-left transition-colors duration-150 ease-brand hover:bg-sand-100"
      >
        {icon}
        <div className="min-w-0 flex-grow">
          <p className="font-display text-[15px] font-semibold text-ink-500">{title}</p>
          <p className="truncate text-xs text-ink-400">{summary}</p>
        </div>
        <ChevronDown
          className={cn("size-4 shrink-0 text-ink-400 transition-transform duration-300 ease-brand", open && "rotate-180")}
        />
      </button>
      <div className={cn("kw-accordion", open && "kw-accordion-open")}>
        <div>
          <div className="border-t border-ink-100 px-5 py-5">{children}</div>
        </div>
      </div>
    </div>
  );
}
