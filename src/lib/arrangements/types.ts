import type { ArrangementPricingMode, PriceDisplayMode } from "@/lib/types/database";
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

/** Lettertype-keuze, bewust beperkt tot drie families die er op de live
 * preview/publieke pagina ÉN in de PDF exact hetzelfde uitzien: "default"
 * (Manrope resp. Helvetica, het bestaande uiterlijk), "serif" (Georgia resp.
 * de ingebouwde PDF-standaardfont Times) en "mono" (Courier New resp. de
 * ingebouwde PDF-standaardfont Courier). Times/Courier hebben geen apart
 * bestand nodig in de PDF (react-pdf/PDF zelf kent ze al ingebouwd, zie
 * `pdfFontName()` in quote-document.tsx) -- vandaar juist deze drie en geen
 * vrije Google Fonts-keuze, die in de PDF weer een heel eigen
 * font-registratie-traject zou vergen. */
export type ArrangementFontFamily = "default" | "serif" | "mono";

/** Velden die elk onderdeel deelt, ongeacht type -- dit is precies wat de
 * vrije indeling instelbaar maakt: een echt vrije plek (`x`: startkolom
 * 0-11 van een 12-koloms raster, `y`: verticale positie in px, ALTIJD vrij
 * en nooit aan een gedeelde "rij" gekoppeld -- twee onderdelen naast elkaar
 * hoeven dus niet meer even hoog te zijn, en een kort onderdeel kan gewoon
 * ergens anders onder een ander kort onderdeel gezet worden, ook als een
 * derde onderdeel ernaast veel langer is. De editor houdt bij het slepen
 * zelf bij dat onderdelen elkaar nooit overlappen, zie `resolveCollisionY`
 * in quote-preview.tsx), breedte (`width`: 1-12 van de 12 kolommen -- vóór
 * de introductie van deze twaalfden was dit een vaste 1-4-keuze van de 4
 * kolommen; oude waarden zijn ×3 omgerekend zodat bestaande arrangementen er
 * identiek uitzien), hoogte (`height`: vaste hoogte in px, of `null` voor
 * automatisch op basis van inhoud -- bij een vaste waarde wordt inhoud die
 * niet past afgekapt, niet uitgerekt of afgebroken), kleur (null = val terug
 * op de arrangementskleur), icoon (null = geen icoon getoond) en tekststijl
 * (`fontFamily`/`fontSize`/`bold`/`italic`/`underline`, null/default/false =
 * het bestaande uiterlijk). */
type ArrangementContentItemBase = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number | null;
  color: string | null;
  icon: string | null;
  fontFamily: ArrangementFontFamily;
  /** Lettergrootte in px (web) / pt (PDF), of `null` voor de bestaande
   * standaardgrootte per element (titel vs. lopende tekst). */
  fontSize: number | null;
  bold: boolean;
  italic: boolean;
  underline: boolean;
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
  pricePerPerson: boolean;
  priceDisplay: PriceDisplayMode;
  contentItems: ArrangementContentItem[];
  pdfUrl: string | null;
  tiers: PriceTierInput[];
  seasons: SeasonPriceInput[];
};
