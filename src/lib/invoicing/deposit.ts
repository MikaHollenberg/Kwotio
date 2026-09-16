import { roundCents, vatFromInclAmount } from "./vat";

export type DepositMode = "percentage" | "fixed";

/**
 * Berekent het aanbetalingsbedrag. `value` is altijd INCLUSIEF btw -- zo
 * denkt een ondernemer/klant erover ("30% aanbetaling", "vraag €500
 * aanbetaling") en het is ook het bedrag dat de klant daadwerkelijk
 * overmaakt. De btw wordt er vervolgens uitgerekend (niet bovenop
 * toegevoegd) -- wettelijk vereist: de btw over het aanbetaalde bedrag moet
 * meteen, volledig op de voorschotnota staan.
 *
 * `orderTotalInclVat` is alleen nodig om een percentage te kunnen berekenen
 * en om te checken dat de aanbetaling niet groter is dan de bestelling --
 * bij een vast bedrag zonder bekende ordertotaal (zie
 * `createStandaloneInvoice`: een aanbetaling hoeft niet meer gekoppeld te
 * zijn aan een vooraf geschatte orderwaarde, want de slotfactuur wordt
 * later toch vanaf 0 met de definitieve regels opgebouwd) mag dit `null`
 * zijn; die check wordt dan overgeslagen.
 */
export function calculateDepositAmount({
  orderTotalInclVat,
  vatRate,
  mode,
  value,
}: {
  orderTotalInclVat: number | null;
  vatRate: number;
  mode: DepositMode;
  value: number;
}) {
  if (value <= 0) throw new Error("De aanbetaling moet groter dan nul zijn.");
  if (mode === "percentage" && orderTotalInclVat == null) {
    throw new Error("Een percentage-aanbetaling heeft een orderwaarde nodig om van te berekenen.");
  }
  const depositInclVat = mode === "percentage" ? roundCents(orderTotalInclVat! * (value / 100)) : roundCents(value);
  if (orderTotalInclVat != null && depositInclVat > orderTotalInclVat) {
    throw new Error("De aanbetaling kan niet groter zijn dan de volledige orderwaarde.");
  }
  const { exclVat, vatAmount } = vatFromInclAmount(depositInclVat, vatRate);
  return { depositExclVat: exclVat, depositVat: vatAmount, depositInclVat };
}
