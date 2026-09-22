import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

/**
 * Gedeeld forminput-patroon voor nieuw werk (hoofdaccount/marketingsite,
 * zie /admin/stijlgids) — bestaande formulieren (login, klanten, etc.)
 * gebruiken dit al als losse className-string per bestand; hier eenmalig
 * als component vastgelegd zodat nieuw werk het gewoon importeert i.p.v.
 * de classNames opnieuw uit te typen. Bestaande formulieren blijven
 * ongewijzigd — geen risico voor al werkende schermen.
 */
export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-11 rounded-brand-sm border border-ink-200 bg-white px-3.5 text-sm text-ink-500 outline-none transition-colors duration-200 ease-brand placeholder:text-ink-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20",
        className,
      )}
      {...props}
    />
  );
}
