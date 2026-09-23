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
      // Sommige markers bestaan bewust dubbel -- bijv. eenzelfde
      // `data-faq-id` op zowel de desktop-Sidebar-link als de mobiele
      // hamburger-menu-link (zie sidebar.tsx/mobile-nav.tsx), waarvan er op
      // elk schermformaat maar één zichtbaar is. `querySelector` geeft altijd
      // de EERSTE match terug, ongeacht zichtbaarheid -- met `querySelectorAll`
      // pakken we in plaats daarvan de eerste die ook echt zichtbaar is.
      const candidates = document.querySelectorAll(selector) as NodeListOf<HTMLElement>;
      const el = Array.from(candidates).find((c) => c.offsetParent !== null) ?? null;
      // offsetParent is null zodra het element (of een voorouder) display:none
      // heeft -- zo herkennen we betrouwbaar dat een element niet zichtbaar is
      // (bijv. de sidebar op mobiel) i.p.v. een zinloze nul-rect te gebruiken.
      if (!el) {
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

    if (!selector) {
      measure();
      return;
    }
    // Geeft een collapsed accordion-sectie (bijv. Instellingen) de kans om
    // zichzelf open te klappen vóórdat we meten -- zie SettingsSection, dat
    // op dit event luistert en zichzelf opent als het doelelement een
    // afstammeling is. Een generiek event i.p.v. dat deze hook iets afweet
    // van accordions/collapsible secties elders in de app.
    window.dispatchEvent(new CustomEvent("kw:reveal", { detail: { selector } }));
    measure();
    window.addEventListener("resize", measure);
    // `capture: true` zodat scrollen binnen geneste containers (bijv. de
    // live preview of de sidebar, die hun eigen overflow-y-auto hebben) ook
    // wordt opgepikt -- zulke scroll-events bubbelen niet naar window.
    window.addEventListener("scroll", measure, true);
    // Vangt het moment op waarop een CSS-transition (bijv. een accordion die
    // openklapt na het `kw:reveal`-event hierboven) klaar is -- de
    // tussentijdse metingen tijdens zo'n animatie zijn niet erg, maar zonder
    // dit zou de spotlight na afloop op de verkeerde (te kleine) positie
    // kunnen blijven staan.
    window.addEventListener("transitionend", measure, true);
    // Een routewissel is niet synchroon -- vooral bij een nog niet
    // gecompileerde dev-route kan het even (soms een paar seconden) duren
    // voordat de nieuwe pagina er staat. Een MutationObserver op de hele
    // pagina vangt dat moment op, ongeacht hoe lang het duurt, i.p.v. te
    // gokken met een vaste timeout. `attributes: true` vangt ook een
    // klasse-/stijlwissel op een al bestaand element (bijv. een accordion
    // die open-/dichtklapt zonder dat er DOM-knopen bij komen of weggaan).
    const observer = new MutationObserver(measure);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style"] });
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("transitionend", measure, true);
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
