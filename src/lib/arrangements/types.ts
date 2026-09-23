import type { ArrangementPricingMode } from "@/lib/types/database";
import type { PriceTierInput, SeasonPriceInput } from "@/lib/arrangements/pricing";

/** Eén regel binnen een "categorie"-onderdeel, bv. "Wit" met toelichting
 * "(Chardonnay, Sauvignon Blanc & Moscato)" -- rechtstreeks gemodelleerd op
 * de aangeleverde arrangement-PDF's van de gebruiker. */
export type ArrangementInclusiefItem = { id: string; text: string; note: string };

/** Optioneel bijboekbare extra, bv. "DJ inhuren" (vast bedrag) of
 * "Mini-cocktail" (per persoon). */
export type ArrangementExtra = {
  id: string;
  name: string;
  price: number;
  unit: "vast" | "p.p.";
};

export type ArrangementContentItemType = "text" | "category" | "extras" | "image" | "highlight";

/** Velden die elk onderdeel deelt, ongeacht type -- dit is precies wat de
 * vrije indeling instelbaar maakt: volgorde (array-positie, sleep-baar),
 * breedte (1-4 van de 4 kolommen), kleur (null = val terug op de
 * arrangementskleur) en icoon (null = geen icoon getoond). */
type ArrangementContentItemBase = {
  id: string;
  width: 1 | 2 | 3 | 4;
  color: string | null;
  icon: string | null;
};

export type ArrangementTextItem = ArrangementContentItemBase & {
  type: "text";
  title: string;
  body: string;
};

export type ArrangementCategoryItem = ArrangementContentItemBase & {
  type: "category";
  title: string;
  items: ArrangementInclusiefItem[];
};

export type ArrangementExtrasItem = ArrangementContentItemBase & {
  type: "extras";
  title: string;
  items: ArrangementExtra[];
};

export type ArrangementImageItem = ArrangementContentItemBase & {
  type: "image";
  imageUrl: string;
  caption: string;
};

export type ArrangementHighlightItem = ArrangementContentItemBase & {
  type: "highlight";
  title: string;
  body: string;
};

export type ArrangementContentItem =
  | ArrangementTextItem
  | ArrangementCategoryItem
  | ArrangementExtrasItem
  | ArrangementImageItem
  | ArrangementHighlightItem;

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
  contentItems: ArrangementContentItem[];
  pdfUrl: string | null;
  tiers: PriceTierInput[];
  seasons: SeasonPriceInput[];
};
