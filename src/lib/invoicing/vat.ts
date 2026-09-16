/**
 * Zuivere btw-rekenlogica voor de factuurmodule (Fase 6) -- geen I/O, geen
 * Supabase. Bewust losstaand van app/src/lib/blocks/pricing.ts: offertes
 * doen NOOIT een btw-berekening (zie migratie 0004 -- `default_vat_rate` is
 * daar juist verwijderd, alleen een incl./excl.-label blijft over), maar een
 * factuur is wettelijk een ander soort document waar het tarief en bedrag
 * per regel wél expliciet op moeten staan.
 *
 * Afronding: altijd op hele centen, per regel en bij optellen -- nooit eerst
 * optellen en dan pas afronden, anders kunnen voorschotnota + slotfactuur
 * een cent uit elkaar lopen t.o.v. de volledige orderwaarde.
 */

export function roundCents(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export function vatFromExclAmount(exclVat: number, vatRate: number) {
  const excl = roundCents(exclVat);
  const vatAmount = roundCents(excl * (vatRate / 100));
  return { exclVat: excl, vatAmount, inclVat: roundCents(excl + vatAmount) };
}

export function vatFromInclAmount(inclVat: number, vatRate: number) {
  const incl = roundCents(inclVat);
  const exclVat = roundCents(incl / (1 + vatRate / 100));
  return { exclVat, vatAmount: roundCents(incl - exclVat), inclVat: incl };
}

export type InvoiceLineAmounts = {
  quantity: number;
  unitPriceExclVat: number;
  vatRate: number;
  vatAmount: number;
  lineTotalInclVat: number;
};

/** Bouwt de bedragen voor één factuurregel vanaf een excl.-btw stukprijs. */
export function calculateInvoiceLineFromExcl({
  quantity,
  unitPriceExclVat,
  vatRate,
}: {
  quantity: number;
  unitPriceExclVat: number;
  vatRate: number;
}): InvoiceLineAmounts {
  const { vatAmount, inclVat } = vatFromExclAmount(quantity * unitPriceExclVat, vatRate);
  return { quantity, unitPriceExclVat: roundCents(unitPriceExclVat), vatRate, vatAmount, lineTotalInclVat: inclVat };
}

/** Bouwt de bedragen voor één factuurregel vanaf een incl.-btw stukprijs
 * (bv. een offerteregel die met price_display = 'incl_btw' is opgesteld). */
export function calculateInvoiceLineFromIncl({
  quantity,
  unitPriceInclVat,
  vatRate,
}: {
  quantity: number;
  unitPriceInclVat: number;
  vatRate: number;
}): InvoiceLineAmounts {
  const { exclVat, vatAmount, inclVat } = vatFromInclAmount(quantity * unitPriceInclVat, vatRate);
  return {
    quantity,
    unitPriceExclVat: quantity > 0 ? roundCents(exclVat / quantity) : 0,
    vatRate,
    vatAmount,
    lineTotalInclVat: inclVat,
  };
}

export function sumInvoiceLines(
  lines: { unitPriceExclVat: number; quantity: number; vatAmount: number; lineTotalInclVat: number }[],
) {
  const subtotalExclVat = roundCents(lines.reduce((sum, l) => sum + l.unitPriceExclVat * l.quantity, 0));
  const vatAmount = roundCents(lines.reduce((sum, l) => sum + l.vatAmount, 0));
  const totalInclVat = roundCents(lines.reduce((sum, l) => sum + l.lineTotalInclVat, 0));
  return { subtotalExclVat, vatAmount, totalInclVat };
}
