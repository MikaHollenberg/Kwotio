"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * Tweede, alternatieve achtergrondstijl voor de publieke pakkettenpagina
 * (naast CoastlineBackground) -- vijf grote, speelse lijn-iconen (zon,
 * cocktail, bbq, zeilboot, zon) die deels van de paginarand af vallen.
 * Ontstaan uit een iteratieve mockup-sessie: steeds groter en losser op
 * verzoek van de gebruiker, tot dit eindresultaat ("JUIST DIT IS
 * GEWELDIG!!").
 *
 * De pagina kan enorm in lengte verschillen (geen offerte geopend vs. een
 * lange offerte met veel blokken) -- daarom is dit één "cyclus" van 5
 * iconen die zo vaak herhaald wordt als nodig is om de hele, daadwerkelijke
 * paginahoogte te vullen (gemeten via ResizeObserver op
 * document.documentElement, zelfde patroon als de embed-hoogtemeting
 * hierboven in public-org-page-view.tsx). Nooit een vaste, te korte lijst.
 *
 * De rand-iconen zijn met `left`/`right` (niet een vaste px-waarde)
 * verankerd, zodat ze op elke schermbreedte netjes vanaf de echte
 * paginarand bleeden i.p.v. vanaf een aanname over de breedte.
 */

const STROKE = "#B06A3C";

type IconProps = { className?: string; style?: CSSProperties };

function SunIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={{ color: STROKE, ...style }} aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round">
        <circle cx="12" cy="12" r="4.6" />
        <path d="M12 2v2.4M12 19.6V22M2 12h2.4M19.6 12H22M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M19.1 4.9l-1.7 1.7M6.6 17.4l-1.7 1.7" />
      </g>
    </svg>
  );
}

function CocktailIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={{ color: STROKE, ...style }} aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 5h14l-7 8-7-8Z" />
        <path d="M12 13v6" />
        <path d="M8.5 19h7" />
        <circle cx="17.5" cy="4.5" r="1.4" />
      </g>
    </svg>
  );
}

function BbqIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={{ color: STROKE, ...style }} aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 12a6 6 0 0 0 12 0Z" />
        <path d="M4 12h16" />
        <path d="M8 15l-2 6M16 15l2 6" />
        <path d="M9 8c0-1.2.8-1.6.8-2.6S9 3.6 9 3.6M12 8c0-1.2.8-1.6.8-2.6S12 3.6 12 3.6M15 8c0-1.2.8-1.6.8-2.6S15 3.6 15 3.6" />
      </g>
    </svg>
  );
}

function BoatIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={{ color: STROKE, ...style }} aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v11" />
        <path d="M12 4c3 1 4.5 3.5 5 7.5-2 .3-4-.2-5-1.2" />
        <path d="M4 17c1.5 1.5 3 2 5 2s3.5-.5 5-2c1.5 1.5 3 2 5 2" />
        <path d="M6 14h12l-1.5 3h-9L6 14Z" />
      </g>
    </svg>
  );
}

/** Eén cyclus, precies de goedgekeurde mockup-opstelling. `top` is relatief
 * aan het begin van de cyclus; CYCLE_HEIGHT bepaalt waar de volgende cyclus
 * begint. Moet ruim genoeg zijn dat de onderste iconen van cyclus N (boot
 * op 1280, eindigt op 1280+740=2020; tweede zon op 1680, eindigt op
 * 1680+680=2360) niet overlappen met de bovenste iconen van cyclus N+1 (zon
 * op -320, boot en zon zitten allebei links dus dat is de knellende
 * combinatie) -- vandaar 2500 i.p.v. de eerdere, te krappe 1960. */
const CYCLE_HEIGHT = 2500;
const CYCLE_ICONS = [
  {
    Icon: SunIcon,
    top: -320,
    className: "-left-[180px] sm:-left-[320px] h-[440px] w-[440px] sm:h-[800px] sm:w-[800px] -rotate-6 opacity-[0.11]",
  },
  {
    Icon: CocktailIcon,
    top: 140,
    className: "-right-[160px] sm:-right-[280px] h-[380px] w-[380px] sm:h-[700px] sm:w-[700px] -rotate-12 opacity-[0.13]",
  },
  {
    Icon: BbqIcon,
    top: 760,
    className: "left-1/2 -translate-x-1/2 h-[360px] w-[360px] sm:h-[660px] sm:w-[660px] rotate-6 opacity-[0.14]",
  },
  {
    Icon: BoatIcon,
    top: 1280,
    className: "-left-[180px] sm:-left-[320px] h-[400px] w-[400px] sm:h-[740px] sm:w-[740px] rotate-6 opacity-[0.12]",
  },
  {
    Icon: SunIcon,
    top: 1680,
    className: "-right-[160px] sm:-right-[280px] h-[370px] w-[370px] sm:h-[680px] sm:w-[680px] rotate-12 opacity-[0.13]",
  },
];

export function IconsBackground() {
  // Begint met 2 cycli (dekt de meeste korte pagina's al meteen, geen
  // "flits" van een lege achtergrond) en groeit daarna mee zodra de
  // daadwerkelijke paginahoogte bekend is (bijv. na het openen van een
  // lange offerte) -- zelfde ResizeObserver-op-documentElement-patroon als
  // de embed-hoogtemeting hierboven in dit bestand.
  const [cycles, setCycles] = useState(2);

  useEffect(() => {
    // ResizeObserver op documentElement reageert betrouwbaar op een echte
    // viewport-resize, maar bleek LIVE getest géén nieuwe meting te geven
    // zodra de paginahoogte puur door ingevoegde inhoud groeit (bv. een
    // klant klikt een offerte/arrangement open) -- de iconen bleven dan op
    // hun aantal van vóór die klik staan, "halverwege" de nu veel langere
    // pagina. Een MutationObserver op <body> vangt precies dát geval wél
    // altijd op (elke toegevoegde/verwijderde DOM-node), dus beide tellers
    // draaien parallel; requestAnimationFrame bundelt snel opeenvolgende
    // meldingen tot één herberekening per frame.
    let frame: number | null = null;
    function scheduleUpdate() {
      if (frame !== null) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        const height = document.documentElement.scrollHeight;
        // +1 extra cyclus als marge, zodat de laatste iconen nooit precies op
        // de rand van "net niet meer gemeten" staan.
        setCycles(Math.max(2, Math.ceil(height / CYCLE_HEIGHT) + 1));
      });
    }
    const resizeObserver = new ResizeObserver(scheduleUpdate);
    resizeObserver.observe(document.documentElement);
    const mutationObserver = new MutationObserver(scheduleUpdate);
    mutationObserver.observe(document.body, { childList: true, subtree: true });
    scheduleUpdate();
    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {Array.from({ length: cycles }).map((_, cycleIndex) =>
        CYCLE_ICONS.map(({ Icon, top, className }, i) => (
          <Icon
            key={`${cycleIndex}-${i}`}
            className={cn("absolute", className)}
            style={{ top: cycleIndex * CYCLE_HEIGHT + top }}
          />
        )),
      )}
    </div>
  );
}
