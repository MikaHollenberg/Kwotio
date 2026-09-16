import "server-only";
import createMollieClient from "@mollie/api-client";

export function getMollieClient(apiKey: string) {
  return createMollieClient({ apiKey });
}

/** Mollie vereist bedragen als string met exact 2 decimalen (geen float) --
 * voorkomt precisie-/afrondingsverschillen in hun eigen API. */
export function toMollieAmount(amount: number): string {
  return amount.toFixed(2);
}
