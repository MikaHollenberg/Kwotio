"use client";

import { useEffect, useState } from "react";
import { Check, ExternalLink, Share, SquarePlus, TriangleAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KwotioMark } from "@/components/brand/kwotio-mark";
import { isIos, isIosSafari, isStandalone } from "@/lib/pwa/detection";

const DISMISS_KEY = "kw_pwa_install_dismissed_tot";
const DISMISS_DAGEN = 7;

// Chrome/Android leveren dit event zonder lib.dom-type — vandaar deze kleine
// eigen typing voor wat we er daadwerkelijk van gebruiken.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Variant = "ios-safari" | "ios-anders" | "android";

function isDismissed(): boolean {
  try {
    const tot = window.localStorage.getItem(DISMISS_KEY);
    return tot !== null && Date.now() < Number(tot);
  } catch {
    return false;
  }
}

function bewaarDismiss() {
  try {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_DAGEN * 24 * 60 * 60 * 1000));
  } catch {
    // Privénavigatie e.d. — banner verschijnt gewoon weer bij een volgend bezoek, onschuldig.
  }
}

/**
 * Aanbeveling om Kwotio als app op het startscherm te zetten — uitsluitend
 * voor bureaupersoneel dat dagelijks met het dashboard werkt, nooit voor een
 * klant. Wordt daarom alleen gemount binnen `app/dashboard/layout.tsx`, dat
 * al achter de login-check zit — nooit op /login, /offerte, /offertes of
 * /embed. Mobiel-only: ook al vuurt `beforeinstallprompt` soms ook op
 * desktop-Chrome, dit blijft daar bewust verborgen.
 */
export function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [variant, setVariant] = useState<Variant | null>(null);

  // Registreert de service worker — alleen in productie (registreren in dev
  // breekt Turbopack's eigen HMR) en alleen hier, dus nooit voor een klant op
  // de publieke pagina's. Los van de installatiebanner hieronder: dit maakt
  // het dashboard sneller/offline-bruikbaar, ongeacht of iemand de banner
  // wegklikt of op desktop zit.
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  useEffect(() => {
    if (isStandalone() || isDismissed()) return;

    // iOS vuurt nooit beforeinstallprompt — daar altijd de handmatige
    // instructies tonen (welke variant hangt af van Safari vs. iets anders).
    // De `react-hooks/set-state-in-effect`-lintregel van dit project staat
    // geen kale setState direct in een effect toe — zelfde
    // requestAnimationFrame-wrap-patroon als elders (zie toast-context.tsx).
    if (isIos()) {
      const iosVariant = isIosSafari() ? "ios-safari" : "ios-anders";
      const frame = requestAnimationFrame(() => setVariant(iosVariant));
      return () => cancelAnimationFrame(frame);
    }

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVariant("android");
    };
    const onInstalled = () => {
      setVariant(null);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!variant) return null;

  const sluiten = () => {
    setVariant(null);
    bewaarDismiss();
  };

  const handleInstalleren = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVariant(null);
  };

  // Onofficiële maar veelgebruikte truc: iOS herkent het "x-safari-https://"-
  // schema en geeft de link altijd aan Safari door, zelfs vanuit de
  // ingebouwde browser van een andere app (Chrome, de Google-app, etc.).
  // Werkt betrouwbaar in Chrome/de Google-app; kan geblokkeerd zijn in enkele
  // extra afgesloten in-app-browsers (bv. Instagram's) — vandaar dat de
  // handmatige instructie eronder als vangnet blijft staan.
  const openInSafari = () => {
    window.location.href = window.location.href.replace(/^http/, "x-safari-http");
  };

  return (
    // Alleen mobiel — bewuste, met de gebruiker afgestemde productkeuze, geen
    // vergeten breakpoint.
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-ink-500/50 sm:hidden"
      onClick={sluiten}
    >
      <div
        className="kw-toast-in w-full max-w-md rounded-t-brand-lg bg-white p-5 shadow-2xl"
        style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom))" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3.5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-11 flex-none items-center justify-center rounded-brand-sm border border-ink-200 bg-white">
              <KwotioMark size={22} />
            </span>
            {variant === "ios-anders" ? (
              <Badge tone="orange">Alleen via Safari</Badge>
            ) : (
              <Badge tone="blue">Aanbevolen · niet verplicht</Badge>
            )}
          </div>
          <button
            type="button"
            onClick={sluiten}
            aria-label="Sluiten"
            className="flex size-7 flex-none items-center justify-center rounded-full text-ink-300 hover:bg-sand-200 hover:text-ink-500"
          >
            <X className="size-4" strokeWidth={2} />
          </button>
        </div>

        <p className="font-display text-base font-semibold text-ink-500">
          {variant === "ios-anders" ? "Installeren werkt hier niet" : "Zet Kwotio op je startscherm"}
        </p>
        <p className="mt-1 text-sm text-ink-400">
          {variant === "android" && "Werk sneller met offertes en facturen, direct vanaf je startscherm."}
          {variant === "ios-safari" && "In 3 tikken, via Safari zelf:"}
          {variant === "ios-anders" && "Deze browser ondersteunt geen installatie. Open Kwotio in Safari om het toe te voegen."}
        </p>

        {variant === "ios-safari" && (
          <div className="mt-3.5 mb-1 flex flex-col gap-2 rounded-brand bg-blue-50 p-3.5">
            <div className="flex items-center gap-2 text-sm text-ink-500">
              <Share className="size-4 flex-none text-orange-500" strokeWidth={2} />
              Tik op het deelicoon in de werkbalk van Safari
            </div>
            <div className="flex items-center gap-2 text-sm text-ink-500">
              <SquarePlus className="size-4 flex-none text-orange-500" strokeWidth={2} />
              Kies &ldquo;Zet op beginscherm&rdquo;
            </div>
            <div className="flex items-center gap-2 text-sm text-ink-500">
              <Check className="size-4 flex-none text-orange-500" strokeWidth={2} />
              Tik op &ldquo;Voeg toe&rdquo;
            </div>
          </div>
        )}

        {variant === "ios-anders" && (
          <div className="mt-3.5 mb-1 flex items-start gap-2.5 rounded-brand border border-orange-200 bg-orange-50 p-3.5">
            <TriangleAlert className="mt-0.5 size-4 flex-none text-orange-600" strokeWidth={2} />
            <p className="text-sm text-orange-800">
              Installeren als app kan alleen via Safari zelf, niet vanuit deze browser.
            </p>
          </div>
        )}

        <div className="mt-4">
          {variant === "android" && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={sluiten} className="flex-1">
                Niet nu
              </Button>
              <Button variant="primary" size="sm" onClick={handleInstalleren} className="flex-1">
                Installeren
              </Button>
            </div>
          )}

          {variant === "ios-safari" && (
            <Button variant="ghost" size="sm" onClick={sluiten} className="w-full">
              Begrepen
            </Button>
          )}

          {variant === "ios-anders" && (
            <div className="flex flex-col gap-2">
              <Button variant="primary" size="sm" onClick={openInSafari} className="w-full">
                <ExternalLink className="size-4" strokeWidth={2} />
                Open in Safari
              </Button>
              <p className="text-center text-xs text-ink-300">
                Lukt dat niet? Kopieer de link en open &lsquo;m handmatig in Safari.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
