/**
 * Huisstijlkleur van een organisatie voor klant-facing plekken (offertepagina,
 * offerte-PDF, publieke aanvraagpagina) -- valt terug op Kwotio's eigen
 * oranje als de organisatie nog geen eigen `brand_theme.primaryColor` heeft
 * ingesteld (zelfde fallback als eerder al gebruikt op de aanvraagpagina,
 * app/src/app/offertes/[slug]/data.ts).
 */
export const DEFAULT_ACCENT_COLOR = "#CC7A3E";

export function resolveAccentColor(org: { brand_theme: Record<string, unknown> | null }): string {
  const theme = org.brand_theme as { primaryColor?: string } | null;
  return theme?.primaryColor || DEFAULT_ACCENT_COLOR;
}
