"use client";

import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";

/** Speelse, wisselende teksten tijdens het genereren van de PDF (die
 * server-side live gerenderd wordt, dus dit is een echte wachttijd) --
 * i.p.v. een kale spinner. Toon minimaal even doorlopen, ook als de PDF
 * sneller klaar is: hard afkappen na 1 stap zou er raar uitzien. */
const LOAD_STEPS = [
  { icon: "🍹", text: "Even de cocktailglazen rechtzetten…" },
  { icon: "📋", text: "De offerte netjes op een rijtje zetten…" },
  { icon: "🌊", text: "Nog even langs de golfbreker…" },
  { icon: "✨", text: "Laatste stofje eraf vegen…" },
];

export function PdfDownloadButton({
  href,
  filename,
  label,
  className,
}: {
  href: string;
  filename: string;
  label: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  async function handleClick() {
    if (loading) return;
    setLoading(true);
    setStepIndex(0);
    intervalRef.current = setInterval(() => {
      setStepIndex((i) => (i + 1) % LOAD_STEPS.length);
    }, 900);
    try {
      const res = await fetch(href);
      if (!res.ok) throw new Error("PDF download mislukt");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // Val terug op een gewone navigatie als de fetch onverwacht faalt --
      // beter een normale download dan helemaal niets.
      window.location.href = href;
    } finally {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setLoading(false);
    }
  }

  const step = LOAD_STEPS[stepIndex];

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={cn("flex items-center gap-2 disabled:cursor-wait", className)}
    >
      {loading ? (
        <>
          <span className="text-base leading-none">{step.icon}</span>
          <span className="hidden sm:inline">{step.text}</span>
        </>
      ) : (
        <>
          <Download className="size-4" />
          <span className="hidden sm:inline">{label}</span>
        </>
      )}
    </button>
  );
}
