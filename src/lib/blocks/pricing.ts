import type { PackageAddon, PackageDraft } from "@/lib/blocks/types";

export type Selections = {
  packageId: string | null;
  addonQuantities: Record<string, number>;
};

export function defaultSelections(
  packages: PackageDraft[],
  addons: PackageAddon[],
): Selections {
  const defaultPackage = packages.find((p) => p.isDefaultSelected) ?? packages[0];
  const addonQuantities: Record<string, number> = {};
  for (const addon of addons) {
    addonQuantities[addon.id] = addon.quantityEditable ? 0 : 0;
  }
  return { packageId: defaultPackage?.id ?? null, addonQuantities };
}

export function calculateSubtotal(
  packages: PackageDraft[],
  addons: PackageAddon[],
  selections: Selections,
): number {
  const selectedPackage = packages.find((p) => p.id === selections.packageId);
  let total = selectedPackage?.price ?? 0;

  for (const addon of addons) {
    const qty = selections.addonQuantities?.[addon.id] ?? 0;
    if (qty > 0) total += addon.price * qty;
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
