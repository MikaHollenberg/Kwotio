import type { ArrangementPricingMode } from "@/lib/types/database";
import type { PriceTierInput, SeasonPriceInput } from "@/lib/arrangements/pricing";

/** Eén regel binnen een "Inclusief"-categorie, bv. "Wit" met toelichting
 * "(Chardonnay, Sauvignon Blanc & Moscato)" -- rechtstreeks gemodelleerd op
 * de aangeleverde arrangement-PDF's van de gebruiker. */
export type ArrangementInclusiefItem = { id: string; text: string; note: string };

/** Eén categorie-vakje, bv. "Bier" of "Wijn", met een eigen lijst regels. */
export type ArrangementInclusiefSection = {
  id: string;
  title: string;
  items: ArrangementInclusiefItem[];
};

/** Optioneel bijboekbare extra, bv. "DJ inhuren" (vast bedrag) of
 * "Mini-cocktail" (per persoon) -- zelfde soort lijst als de "Tips" in de
 * aangeleverde PDF's. */
export type ArrangementExtra = {
  id: string;
  name: string;
  price: number;
  unit: "vast" | "p.p.";
};

/** Samenvatting van een catalogusarrangement zoals gebruikt door de
 * "Arrangement toevoegen"-picker in de offerte-editor (`AddBlockMenu`) --
 * bevat alles wat nodig is om zowel de prijs live te tonen
 * (`calculateArrangementPrice()`) als bij selectie het volledige
 * offerteblok te bouwen (`newBlockFromArrangement()`). */
export type ArrangementPickerSummary = {
  id: string;
  name: string;
  description: string;
  category: string;
  colorCode: string;
  pricingMode: ArrangementPricingMode;
  basePrice: number;
  inclusiefSections: ArrangementInclusiefSection[];
  highlightTitle: string | null;
  highlightText: string | null;
  extras: ArrangementExtra[];
  tiers: PriceTierInput[];
  seasons: SeasonPriceInput[];
};
