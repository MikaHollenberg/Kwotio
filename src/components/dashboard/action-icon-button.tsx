"use client";

import { useState, type ComponentType } from "react";
import { Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Phase = "idle" | "pending" | "done";

/** Icoon-knop die tijdens een async actie (dupliceren/archiveren/verwijderen)
 * zichzelf omtovert tot een draaiende laadring en daarna kort een groen
 * vinkje toont -- i.p.v. alleen `disabled` te worden, wat geen enkele
 * bevestiging gaf dat er iets gebeurde. `onAction` mag gewoon gooien
 * (bv. een Next.js `redirect()`-throw of een echte fout): die propageert
 * hier ongewijzigd verder naar de aanroeper, alleen de fase reset dan
 * meteen naar "idle" i.p.v. op "pending" te blijven hangen. */
export function ActionIconButton({
  icon: Icon,
  title,
  onAction,
  disabled,
  className,
  iconClassName = "size-4",
  danger,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  onAction: () => Promise<void> | void;
  disabled?: boolean;
  className?: string;
  iconClassName?: string;
  /** Rode gloed op het vinkje-moment i.p.v. groen -- voor verwijderen. */
  danger?: boolean;
}) {
  const [phase, setPhase] = useState<Phase>("idle");

  async function handleClick() {
    if (phase !== "idle") return;
    setPhase("pending");
    try {
      await onAction();
      setPhase("done");
      setTimeout(() => setPhase("idle"), 900);
    } catch (err) {
      setPhase("idle");
      throw err;
    }
  }

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled || phase !== "idle"}
      onClick={handleClick}
      className={cn(
        "flex size-8 items-center justify-center rounded-brand-sm text-ink-400 transition-colors duration-200 ease-brand hover:bg-sand-200 hover:text-ink-500 disabled:pointer-events-none",
        className,
      )}
    >
      {phase === "idle" && <Icon className={iconClassName} />}
      {phase === "pending" && <Loader2 className={cn(iconClassName, "animate-spin text-teal-600")} />}
      {phase === "done" && (
        <Check className={cn(iconClassName, "kw-pop-in", danger ? "text-red-600" : "text-green-600")} />
      )}
    </button>
  );
}
