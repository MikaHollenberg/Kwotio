import type { PackageAddon, PackageDraft } from "@/lib/blocks/types";

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

export function calculateSubtotal(blocks: PackagesBlockInput[], selections: Selections): number {
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

  return total;
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
