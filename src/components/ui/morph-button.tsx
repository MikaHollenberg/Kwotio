"use client";

import type { ComponentProps, ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/** Knop die zijn eigen status toont i.p.v. alleen de labeltekst te wisselen:
 * idle -> spinner -> vinkje, elke fase morft in/uit i.p.v. te knipperen
 * (Kwotio Motion Concepts #11). `pending`/`done` zijn bewust twee losse
 * booleans (i.p.v. één "status"-enum) zodat de aanroeper zijn bestaande
 * useTransition-pending 1-op-1 kan doorgeven, en de "done"-flash apart kan
 * timen na een succesvolle server-actie. */
export function MorphButton({
  pending,
  done,
  idleLabel,
  doneLabel,
  className,
  ...props
}: {
  pending: boolean;
  done: boolean;
  idleLabel: ReactNode;
  doneLabel: ReactNode;
} & Omit<ComponentProps<typeof Button>, "children">) {
  return (
    <Button {...props} disabled={props.disabled || pending} className={cn("relative overflow-hidden", className)}>
      <span
        className={cn(
          "flex items-center gap-2 transition-all duration-200 ease-brand",
          (pending || done) && "scale-75 opacity-0",
        )}
      >
        {idleLabel}
      </span>
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-all duration-200 ease-brand",
          pending ? "scale-100 opacity-100" : "scale-75 opacity-0",
        )}
      >
        <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      </span>
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center gap-1.5 transition-all duration-200 ease-brand",
          done ? "scale-100 opacity-100" : "scale-75 opacity-0",
        )}
      >
        <Check className="size-4 kw-pop-in" strokeWidth={3} />
        {doneLabel}
      </span>
    </Button>
  );
}
