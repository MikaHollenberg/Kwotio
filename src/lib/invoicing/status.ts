import type { tones } from "@/components/ui/badge";
import type { InvoiceStatus, InvoiceType, InvoicePaymentMethod } from "@/lib/types/database";

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  concept: "Concept",
  open: "Open",
  deels_betaald: "Deels betaald",
  betaald: "Betaald",
  vervallen: "Vervallen",
  geannuleerd: "Geannuleerd",
};

export const INVOICE_STATUS_TONES: Record<InvoiceStatus, keyof typeof tones> = {
  concept: "neutral",
  open: "blue",
  deels_betaald: "yellow",
  betaald: "green",
  vervallen: "red",
  geannuleerd: "neutral",
};

export const INVOICE_TYPE_LABELS: Record<InvoiceType, string> = {
  standaard: "Factuur",
  aanbetaling: "Aanbetalingsfactuur",
  slotfactuur: "Slotfactuur",
  creditnota: "Creditnota",
};

/** Kortere variant voor compacte plekken zoals een badge in de facturenlijst
 * -- alleen `standaard` blijft daar bewust ongelabeld (zie `InvoicesTable`),
 * de andere drie types moeten in één oogopslag opvallen. */
export const INVOICE_TYPE_SHORT_LABELS: Record<InvoiceType, string> = {
  standaard: "Factuur",
  aanbetaling: "Aanbetaling",
  slotfactuur: "Slotfactuur",
  creditnota: "Creditnota",
};

export const INVOICE_TYPE_TONES: Record<InvoiceType, keyof typeof tones> = {
  standaard: "neutral",
  aanbetaling: "orange",
  slotfactuur: "teal",
  creditnota: "red",
};

/** Handmatige betaalmethodes bij "Markeer als betaald" -- `mollie` wordt
 * nooit hier gekozen, die zet alleen de Mollie-webhook zelf. */
export const MANUAL_PAYMENT_METHODS: Exclude<InvoicePaymentMethod, "mollie">[] = [
  "overboeking",
  "pin",
  "contant",
  "sponsoring",
  "overig",
];

export const INVOICE_PAYMENT_METHOD_LABELS: Record<InvoicePaymentMethod, string> = {
  mollie: "Mollie",
  overboeking: "Overboeken",
  pin: "Pin",
  contant: "Contant",
  sponsoring: "Sponsoring",
  overig: "Overig",
};
