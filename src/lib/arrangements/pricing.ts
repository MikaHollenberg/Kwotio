import type { ArrangementPricingMode } from "@/lib/types/database";

export type PriceTierInput = { id: string; minGuests: number; maxGuests: number | null; price: number };
export type SeasonPriceInput = { id: string; label: string; startDate: string; endDate: string; price: number };

export type ArrangementPriceResult = {
  price: number;
  /** Welk mechanisme de uiteindelijke prijs bepaalde -- "basis" als het
   * ingestelde prijsmodel niet van toepassing was op deze invoer (bv.
   * staffel-modus maar geen tier past bij het aantal personen). */
  source: "basis" | "staffel" | "seizoen";
  /** Mensleesbare toelichting, bv. "11-25 personen" of "Hoogseizoen". */
  appliedLabel: string | null;
};

/** Tiers zijn een aaneengesloten reeks (min_guests, max_guests) -- de eerste
 * tier waar `guestCount` binnen valt wint. `maxGuests: null` = geen
 * bovengrens ("26+"). */
export function findApplicableTier(tiers: PriceTierInput[], guestCount: number): PriceTierInput | null {
  return tiers.find((t) => guestCount >= t.minGuests && (t.maxGuests == null || guestCount <= t.maxGuests)) ?? null;
}

/** Eerste periode waar `isoDate` (YYYY-MM-DD) binnen valt -- overlappende
 * periodes zijn een instelfout van de organisatie zelf, geen technisch
 * probleem; we pakken gewoon de eerst gedefinieerde. */
export function findApplicableSeason(seasons: SeasonPriceInput[], isoDate: string): SeasonPriceInput | null {
  return seasons.find((s) => isoDate >= s.startDate && isoDate <= s.endDate) ?? null;
}

/**
 * Berekent de prijs van een arrangement voor een concrete situatie
 * (aantal personen + datum). Eén prijsmodel per arrangement (vast/staffel/
 * seizoen, `arrangements.pricing_mode`) -- geen combinatie van staffel en
 * seizoen tegelijk, dat houdt zowel de rekenlogica als de uitleg in de UI
 * simpel. Valt terug op de basisprijs zodra het gekozen model geen
 * passende tier/periode vindt (bv. een datum buiten alle gedefinieerde
 * seizoenen).
 */
export function calculateArrangementPrice(
  arrangement: { basePrice: number; pricingMode: ArrangementPricingMode },
  tiers: PriceTierInput[],
  seasons: SeasonPriceInput[],
  input: { guestCount: number | null; eventDate: string | null },
): ArrangementPriceResult {
  if (arrangement.pricingMode === "staffel" && input.guestCount != null) {
    const tier = findApplicableTier(tiers, input.guestCount);
    if (tier) {
      const label = tier.maxGuests == null ? `${tier.minGuests}+ personen` : `${tier.minGuests}-${tier.maxGuests} personen`;
      return { price: tier.price, source: "staffel", appliedLabel: label };
    }
  }

  if (arrangement.pricingMode === "seizoen" && input.eventDate) {
    const season = findApplicableSeason(seasons, input.eventDate);
    if (season) {
      return { price: season.price, source: "seizoen", appliedLabel: season.label };
    }
  }

  return { price: arrangement.basePrice, source: "basis", appliedLabel: null };
}

/**
 * Laagst mogelijke prijs van dit arrangement, voor plekken waar het aantal
 * personen/de datum van de bezoeker nog niet bekend is (de publieke
 * offertepagina) -- een "vanaf"-prijs i.p.v. altijd de basisprijs te tonen,
 * die bij staffel/seizoen vaak helemaal niet de prijs is die iemand
 * uiteindelijk betaalt.
 */
export function calculateStartingPrice(
  arrangement: { basePrice: number; pricingMode: ArrangementPricingMode },
  tiers: PriceTierInput[],
  seasons: SeasonPriceInput[],
): number {
  if (arrangement.pricingMode === "staffel" && tiers.length > 0) {
    return Math.min(arrangement.basePrice, ...tiers.map((t) => t.price));
  }
  if (arrangement.pricingMode === "seizoen" && seasons.length > 0) {
    return Math.min(arrangement.basePrice, ...seasons.map((s) => s.price));
  }
  return arrangement.basePrice;
}
