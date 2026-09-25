export type ArrangementPriceLineInput = { id: string; label: string; unit: "vast" | "p.p."; amount: number };
export type ArrangementSeasonInput = {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  prices: ArrangementPriceLineInput[];
};
export type ArrangementSurchargeInput = {
  id: string;
  label: string;
  minGuests: number;
  maxGuests: number | null;
  unit: "vast" | "p.p.";
  amount: number;
};

/** Eerste seizoen waar `isoDate` (YYYY-MM-DD) binnen valt -- overlappende
 * periodes zijn een instelfout van de organisatie zelf, we pakken gewoon de
 * eerst gedefinieerde. `null` als er geen datum bekend is of geen seizoen
 * past -- dan gelden de "altijd actieve" prijzen. */
export function findApplicableSeason(seasons: ArrangementSeasonInput[], isoDate: string | null): ArrangementSeasonInput | null {
  if (!isoDate) return null;
  return seasons.find((s) => isoDate >= s.startDate && isoDate <= s.endDate) ?? null;
}

/**
 * Welke prijsregels gelden voor een arrangement op een concrete datum (of
 * geen datum, bv. de publieke catalogus waar een bezoeker nog niets
 * gekozen heeft) -- het seizoen dat past vervangt de "altijd actieve"
 * regels volledig, in plaats van ernaast op te tellen.
 */
export function resolveArrangementPrices(
  prices: ArrangementPriceLineInput[],
  seasons: ArrangementSeasonInput[],
  eventDate: string | null,
): { prices: ArrangementPriceLineInput[]; seasonLabel: string | null } {
  const season = findApplicableSeason(seasons, eventDate);
  if (season) return { prices: season.prices, seasonLabel: season.label };
  return { prices, seasonLabel: null };
}

/** Laagst mogelijke prijs over alle prijsregels heen (ongeacht vast/p.p.),
 * voor plekken waar geen datum bekend is en gewoon een "vanaf"-indicatie
 * getoond moet worden (de publieke catalogus). Kijkt ook naar elk seizoen
 * afzonderlijk, zodat een goedkoper seizoenstarief ook meetelt. */
export function calculateStartingPrice(prices: ArrangementPriceLineInput[], seasons: ArrangementSeasonInput[]): number | null {
  const allAmounts = [...prices, ...seasons.flatMap((s) => s.prices)].map((p) => p.amount);
  return allAmounts.length > 0 ? Math.min(...allAmounts) : null;
}
