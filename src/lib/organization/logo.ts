import type { LogoPreference } from "@/lib/types/database";

/**
 * Welk van de twee geüploade logo's getoond wordt op plekken met één enkel
 * logo (publieke offertepagina, PDF, instellingen-voorbeeld) — bepaald door
 * de voorkeur van de organisatie, met terugval op het andere logo als het
 * voorkeurslogo niet is geüpload. De menubalk linksboven in het dashboard
 * gebruikt hier bewust géén gebruik van — die toont altijd het horizontale
 * logo (zie app/src/components/dashboard/sidebar.tsx).
 */
export function resolvePreferredLogo(org: {
  logo_horizontal_url: string | null;
  logo_square_url: string | null;
  logo_preference: LogoPreference;
}): string | null {
  const preferred = org.logo_preference === "vierkant" ? org.logo_square_url : org.logo_horizontal_url;
  const fallback = org.logo_preference === "vierkant" ? org.logo_horizontal_url : org.logo_square_url;
  return preferred ?? fallback ?? null;
}
