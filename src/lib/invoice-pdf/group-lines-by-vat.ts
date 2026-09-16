import { roundCents } from "@/lib/invoicing/vat";

export type VatSummaryRow = {
  vatRate: number;
  basisExclVat: number;
  vatAmount: number;
};

/**
 * Groepeert factuurregels per btw-tarief voor de btw-samenvattingstabel
 * onderaan de factuur (tarief/grondslag/bedrag) -- de gangbare NL-indeling
 * zodra een factuur meerdere tarieven door elkaar heeft (zie het
 * voorbeeld van de gebruiker: drankarrangement laag + hoog op dezelfde
 * factuur). Vervangt de eerdere "btw per regel"-kolom.
 */
export function groupLinesByVat(
  lines: { unitPrice: number; quantity: number; vatRate: number; vatAmount: number }[],
): VatSummaryRow[] {
  const byRate = new Map<number, VatSummaryRow>();
  for (const line of lines) {
    const existing = byRate.get(line.vatRate) ?? { vatRate: line.vatRate, basisExclVat: 0, vatAmount: 0 };
    existing.basisExclVat = roundCents(existing.basisExclVat + line.unitPrice * line.quantity);
    existing.vatAmount = roundCents(existing.vatAmount + line.vatAmount);
    byRate.set(line.vatRate, existing);
  }
  return [...byRate.values()].sort((a, b) => b.vatRate - a.vatRate);
}
