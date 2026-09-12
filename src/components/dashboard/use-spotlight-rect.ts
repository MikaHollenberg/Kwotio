"use client";

import { useEffect, useState } from "react";

/** Zoekt live de positie op van een element via een CSS-selector, zodat een
 * spotlight-overlay kan meebewegen/-schalen bij resize. `null` betekent: geen
 * (zichtbaar) element gevonden -- de aanroeper toont dan een gecentreerd
 * venster i.p.v. een spotlight (bijv. op mobiel, waar de sidebar-navigatie
 * niet in beeld is, of wanneer een stap bewust geen specifiek element heeft).
 * Gedeeld door de onboarding-rondleiding (ProductTour) en de FAQ-
 * stappenplannen (FaqWalkthrough), zodat de meetlogica niet dubbel bestaat. */
export function useSpotlightRect(selector: string | null) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    // Voorkomt dat elke hermeting (bijv. via de MutationObserver hieronder)
    // opnieuw scrollt -- hooguit één keer per stap in beeld brengen, anders
    // vecht dit met de gebruiker die zelf probeert te scrollen tijdens de
    // scroll-animatie.
    let scrolledIntoView = false;

    function measure() {
      // Geen selector (bewust informatieve stap zonder doelelement) -- altijd
      // resetten, anders blijft de rect van een vorige stap staan (dit zit
      // in `measure()` zelf i.p.v. los in het effect-lichaam, zodat het geen
      // rechtstreekse setState-aanroep in de effect-body is).
      if (!selector) {
        setRect(null);
        return;
      }
      const el = document.querySelector(selector) as HTMLElement | null;
      // offsetParent is null zodra het element (of een voorouder) display:none
      // heeft -- zo herkennen we betrouwbaar dat een element niet zichtbaar is
      // (bijv. de sidebar op mobiel) i.p.v. een zinloze nul-rect te gebruiken.
      if (!el || el.offsetParent === null) {
        setRect(null);
        return;
      }
      const domRect = el.getBoundingClientRect();
      setRect(domRect);

      if (!scrolledIntoView) {
        scrolledIntoView = true;
        const fullyVisible = domRect.top >= 0 && domRect.bottom <= window.innerHeight;
        if (!fullyVisible) {
          // Brengt het doelelement in beeld als een stap er eentje spotlight
          // die (deels) buiten het scherm valt -- zonder dit stond het
          // wolkje soms ver onder- of bovenaan, buiten zicht. De `scroll`-
          // listener hieronder houdt de spotlight tijdens de animatie
          // meebewegend.
          el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        }
      }
    }

    measure();
    if (!selector) return;
    window.addEventListener("resize", measure);
    // `capture: true` zodat scrollen binnen geneste containers (bijv. de
    // live preview of de sidebar, die hun eigen overflow-y-auto hebben) ook
    // wordt opgepikt -- zulke scroll-events bubbelen niet naar window.
    window.addEventListener("scroll", measure, true);
    // Een routewissel is niet synchroon -- vooral bij een nog niet
    // gecompileerde dev-route kan het even (soms een paar seconden) duren
    // voordat de nieuwe pagina er staat. Een MutationObserver op de hele
    // pagina vangt dat moment op, ongeacht hoe lang het duurt, i.p.v. te
    // gokken met een vaste timeout.
    const observer = new MutationObserver(measure);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
      observer.disconnect();
    };
  }, [selector]);

  return rect;
}

/** Bepaalt waar het uitlegwolkje moet komen t.o.v. het gespotlighte element:
 * bij voorkeur rechts ervan, maar links ervan als het element te dicht bij
 * de rechterrand van het scherm staat (anders zou het wolkje half over de
 * eigen spotlight heen vallen i.p.v. ernaast). Verticaal blijft het wolkje
 * altijd binnen het scherm. */
export function getCalloutPosition(targetRect: DOMRect, calloutWidth = 320, calloutMaxHeight = 260) {
  const margin = 16;
  const spaceOnRight = window.innerWidth - (targetRect.right + margin);
  const left =
    spaceOnRight >= calloutWidth
      ? targetRect.right + margin
      : Math.max(margin, targetRect.left - calloutWidth - margin);
  const top = Math.min(Math.max(targetRect.top - 8, margin), window.innerHeight - calloutMaxHeight);
  return { left, top };
}
