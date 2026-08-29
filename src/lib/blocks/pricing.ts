import type { PackageAddon, PackageDraft } from "@/lib/blocks/types";

/**
 * Eén keuze per "Pakketten & prijzen"-blok (blockId -> gekozen pakket-id),
 * zodat meerdere pakketten-blokken in dezelfde offerte onafhankelijk van
 * elkaar gekozen kunnen worden — hun prijzen worden allemaal bij elkaar
 * opgeteld. Addon-ids zijn al uniek over de hele offerte heen (client-
 * gegenereerde UUID's), dus die blijven gewoon in één platte map.
 */
export type Selections = {
  packageIdByBlock: Record<string, string | null>;
  addonQuantities: Record<string, number>;
};

export type PackagesBlockInput = {
  blockId: string;
  packages: PackageDraft[];
  addons: PackageAddon[];
};

export function defaultSelections(blocks: PackagesBlockInput[]): Selections {
  const packageIdByBlock: Record<string, string | null> = {};
  const addonQuantities: Record<string, number> = {};

  for (const { blockId, packages, addons } of blocks) {
    const defaultPackage = packages.find((p) => p.isDefaultSelected) ?? packages[0];
    packageIdByBlock[blockId] = defaultPackage?.id ?? null;
    for (const addon of addons) {
      addonQuantities[addon.id] = 0;
    }
  }

  return { packageIdByBlock, addonQuantities };
}

export function calculateSubtotal(blocks: PackagesBlockInput[], selections: Selections): number {
  let total = 0;

  for (const { blockId, packages, addons } of blocks) {
    const selectedPackage = packages.find((p) => p.id === selections.packageIdByBlock[blockId]);
    total += selectedPackage?.price ?? 0;

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
