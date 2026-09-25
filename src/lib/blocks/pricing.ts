import type { PackageAddon, PackageDraft, PackagesBlockContent, ArrangementBlockContent } from "@/lib/blocks/types";
import type { BlockType } from "@/lib/types/database";
import { formatCurrency } from "@/lib/utils";

/**
 * Gekozen pakket-id('s) per "Pakketten & prijzen"-blok (blockId -> array van
 * gekozen pakket-id's), zodat meerdere pakketten-blokken in dezelfde offerte
 * onafhankelijk van elkaar gekozen kunnen worden — hun prijzen worden
 * allemaal bij elkaar opgeteld. Een blok staat standaard op maximaal 1 keuze
 * (array met 0 of 1 element), maar kan ingesteld worden op maximaal 2 (zie
 * `PackagesBlockContent.maxSelections`) — dan tellen beide gekozen
 * pakketprijzen mee. Addon-ids zijn al uniek over de hele offerte heen
 * (client-gegenereerde UUID's), dus die blijven gewoon in één platte map.
 *
 * Bestaande offertes (vóór deze feature) hebben deze kolom nog in het oude,
 * platte formaat (`Record<string, string | null>`) staan in de database —
 * gebruik `normalizeSelectedPackages()` bij het uitlezen van opgeslagen data.
 */
export type Selections = {
  packageIdByBlock: Record<string, string[]>;
  addonQuantities: Record<string, number>;
};

export type PackagesBlockInput = {
  blockId: string;
  packages: PackageDraft[];
  addons: PackageAddon[];
};

/** Zet een (mogelijk oud, plat) `selected_packages`-jsonb-object om naar de
 * huidige array-vorm — oude rijen hebben per blok een losse string of
 * `null` in plaats van een array. */
export function normalizeSelectedPackages(
  raw: Record<string, unknown> | null | undefined,
): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const [blockId, value] of Object.entries(raw ?? {})) {
    if (Array.isArray(value)) result[blockId] = value as string[];
    else if (typeof value === "string") result[blockId] = [value];
    else result[blockId] = [];
  }
  return result;
}

/**
 * Verzamelt alle blokken die aan het totaal bijdragen ("Pakketten & prijzen"
 * én "Arrangement") en zet ze om naar één gemeenschappelijke
 * `PackagesBlockInput`-vorm, zodat calculateSubtotal/defaultSelections/
 * Selections ongewijzigd blijven werken voor beide bloktypes. Een
 * arrangementblok heeft geen keuzepakket meer (zie ArrangementBlockContent —
 * de prijsregels zelf zijn altijd-actieve posten, geen keuze, en tellen apart
 * mee via sumArrangementPrices()); alleen de extra's van dat arrangement
 * worden hier de addons van dat blok, dus die tellen op dezelfde manier mee
 * als optionele pakket-addons altijd al deden — met hun eigen vast/p.p.
 * (`forcedUnit`), zodat een vaste extra (bv. een DJ) nooit als p.p. meetelt
 * puur omdat de offerte dat globaal aan heeft staan.
 */
export function collectPricedBlocks(
  blocks: { id: string; type: BlockType; content: Record<string, unknown> }[],
): PackagesBlockInput[] {
  const result: PackagesBlockInput[] = [];

  for (const block of blocks) {
    if (block.type === "packages") {
      const content = block.content as unknown as PackagesBlockContent;
      result.push({ blockId: block.id, packages: content.packages, addons: content.addons });
    } else if (block.type === "arrangement") {
      const content = block.content as unknown as ArrangementBlockContent;
      result.push({
        blockId: block.id,
        packages: [],
        addons: content.contentItems
          .filter((item) => item.type === "extras")
          .flatMap((item) => item.items)
          .map((extra) => ({
            id: extra.id,
            packageId: null,
            name: extra.unit === "p.p." ? `${extra.name} (p.p.)` : extra.name,
            description: "",
            price: extra.price,
            quantityEditable: false,
            defaultQuantity: 0,
            forcedUnit: extra.unit,
          })),
      });
    }
  }

  return result;
}

export function defaultSelections(blocks: PackagesBlockInput[]): Selections {
  const packageIdByBlock: Record<string, string[]> = {};
  const addonQuantities: Record<string, number> = {};

  for (const { blockId, packages, addons } of blocks) {
    const defaultPackage = packages.find((p) => p.isDefaultSelected) ?? packages[0];
    packageIdByBlock[blockId] = defaultPackage ? [defaultPackage.id] : [];
    for (const addon of addons) {
      addonQuantities[addon.id] = 0;
    }
  }

  return { packageIdByBlock, addonQuantities };
}

/** Som van de altijd-actieve prijsregels van elk arrangementblok, apart per
 * vast/p.p. -- deze regels lopen niet via het pakket/addon-selectiesysteem
 * (er is geen keuze, ze gelden altijd), dus worden hier los bijgeteld. */
function sumArrangementPrices(
  blocks: { type: BlockType; content: Record<string, unknown> }[],
): { fixed: number; perPerson: number } {
  let fixed = 0;
  let perPerson = 0;
  for (const block of blocks) {
    if (block.type !== "arrangement") continue;
    const content = block.content as unknown as ArrangementBlockContent;
    for (const line of content.prices) {
      if (line.unit === "p.p.") perPerson += line.amount;
      else fixed += line.amount;
    }
  }
  return { fixed, perPerson };
}

/** Eén blended getal -- gebruikt voor opgeslagen totalen (quotes.total,
 * rapportage/statistieken, facturatie), waar vast/p.p. niet apart getoond
 * hoeft te worden. `arrangementBlocks` is optioneel voor bestaande
 * aanroepers, maar wél nodig om arrangement-prijsregels mee te tellen. */
export function calculateSubtotal(
  blocks: PackagesBlockInput[],
  selections: Selections,
  arrangementBlocks: { type: BlockType; content: Record<string, unknown> }[] = [],
): number {
  let total = 0;

  for (const { blockId, packages, addons } of blocks) {
    const selectedIds = selections.packageIdByBlock[blockId] ?? [];
    for (const pkg of packages) {
      if (selectedIds.includes(pkg.id)) total += pkg.price;
    }

    for (const addon of addons) {
      const qty = selections.addonQuantities?.[addon.id] ?? 0;
      if (qty > 0) total += addon.price * qty;
    }
  }

  const { fixed, perPerson } = sumArrangementPrices(arrangementBlocks);
  total += fixed + perPerson;

  return total;
}

/**
 * Zelfde optelling als calculateSubtotal, maar geeft vaste en per-persoon-
 * bedragen apart terug i.p.v. één blend -- gebruikt op elke plek waar het
 * bedrag echt aan iemand getoond wordt (bureau-preview, klantpagina,
 * onderteken-scherm, PDF, certificaat), zodat een vaste post (bv. een DJ
 * voor €600) nooit "p.p." krijgt opgeplakt puur omdat de offerte globaal op
 * per-persoon staat. Een gewoon pakket-addon volgt nog steeds de offerte-
 * brede instelling (`quotePricePerPerson`), inclusief de bestaande
 * uitzondering voor `quantityEditable`-addons; alleen een addon met een
 * eigen `forcedUnit` (arrangement-extra's) wijkt daarvan af.
 */
export function calculateSplitSubtotal(
  blocks: PackagesBlockInput[],
  selections: Selections,
  quotePricePerPerson: boolean,
  arrangementBlocks: { type: BlockType; content: Record<string, unknown> }[] = [],
): { fixedAmount: number; perPersonAmount: number } {
  let fixedAmount = 0;
  let perPersonAmount = 0;

  for (const { blockId, packages, addons } of blocks) {
    const selectedIds = selections.packageIdByBlock[blockId] ?? [];
    for (const pkg of packages) {
      if (!selectedIds.includes(pkg.id)) continue;
      if (quotePricePerPerson) perPersonAmount += pkg.price;
      else fixedAmount += pkg.price;
    }

    for (const addon of addons) {
      const qty = selections.addonQuantities?.[addon.id] ?? 0;
      if (qty <= 0) continue;
      const isPerPerson = addon.forcedUnit ? addon.forcedUnit === "p.p." : quotePricePerPerson && !addon.quantityEditable;
      if (isPerPerson) perPersonAmount += addon.price * qty;
      else fixedAmount += addon.price * qty;
    }
  }

  const arrangementSums = sumArrangementPrices(arrangementBlocks);
  fixedAmount += arrangementSums.fixed;
  perPersonAmount += arrangementSums.perPerson;

  return { fixedAmount, perPersonAmount };
}

/** Leesbare weergave van een gesplitst bedrag, bv. "€600,00 + €39,50 p.p."
 * als er zowel een vaste als een per-persoon-post is, of gewoon één van de
 * twee zonder onnodige "+ €0,00" als er maar één soort bedrag is. */
export function formatSplitPrice(fixedAmount: number, perPersonAmount: number, currency: string): string {
  const fixedStr = formatCurrency(fixedAmount, currency);
  const perPersonStr = `${formatCurrency(perPersonAmount, currency)} p.p.`;
  if (fixedAmount > 0 && perPersonAmount > 0) return `${fixedStr} + ${perPersonStr}`;
  if (perPersonAmount > 0) return perPersonStr;
  return fixedStr;
}

export function calculateTotal({
  subtotal,
  discountAmount,
}: {
  subtotal: number;
  discountAmount: number;
}) {
  return Math.max(0, subtotal - discountAmount);
}

/**
 * `quotes.total` is bij prijs-per-persoon-offertes het bedrag PER PERSOON, niet
 * het werkelijke totaal (zie price-display-architectuur: bewust geen rekensom
 * tijdens het bekijken/kiezen, want het aantal is pas bij ondertekenen bekend).
 * Deze helper is voor intern gebruik (bureau-overzichten/statistieken, nooit
 * klant-facing): zodra het aantal bekend is, vermenigvuldigt hij; anders valt
 * hij terug op het kale (p.p.-)bedrag.
 */
export function calculateActualQuoteValue({
  total,
  pricePerPerson,
  aantalPersonen,
}: {
  total: number;
  pricePerPerson: boolean;
  aantalPersonen: number | null;
}): number {
  return pricePerPerson && aantalPersonen != null ? total * aantalPersonen : total;
}
