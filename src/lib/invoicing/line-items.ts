import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import { loadQuoteBlocks } from "@/lib/blocks/persistence";
import { normalizeSelectedPackages, collectPricedBlocks } from "@/lib/blocks/pricing";
import { calculateInvoiceLineFromExcl, calculateInvoiceLineFromIncl, type InvoiceLineAmounts } from "./vat";

export type InvoiceLineDraft = InvoiceLineAmounts & {
  description: string;
  sourcePackageId: string | null;
  sourceAddonId: string | null;
};

function buildLineAmounts(
  quantity: number,
  unitPrice: number,
  vatRate: number,
  priceDisplay: "incl_btw" | "excl_btw",
): InvoiceLineAmounts {
  return priceDisplay === "incl_btw"
    ? calculateInvoiceLineFromIncl({ quantity, unitPriceInclVat: unitPrice, vatRate })
    : calculateInvoiceLineFromExcl({ quantity, unitPriceExclVat: unitPrice, vatRate });
}

/**
 * Kopieert de gekozen pakketten/opties van een geaccepteerde offerte naar
 * factuurregels. Werkt vanaf dezelfde `selected_packages`/`selected_addons`
 * die de klant ook echt gekozen heeft (normalizeSelectedPackages -- zelfde
 * helper als de offerte-PDF gebruikt, zie pricing.ts), nooit een eigen
 * kopie van de selectielogica.
 *
 * `quote.price_display` bepaalt of `pkg.price`/`addon.price` als excl.- of
 * incl.-btw stukprijs gelezen moet worden -- offertes zelf doen geen
 * btw-berekening (zie vat.ts), dus dat onderscheid is hier, bij het naar-
 * factuur-omzetten, de eerste plek waar het er echt toe doet.
 */
export async function buildInvoiceLinesFromQuote(
  supabase: SupabaseClient<Database>,
  quote: {
    id: string;
    price_display: "incl_btw" | "excl_btw";
    selected_packages: Record<string, unknown> | null;
    selected_addons: Record<string, number> | null;
  },
  vatRate: number,
): Promise<InvoiceLineDraft[]> {
  const blocks = await loadQuoteBlocks(supabase, quote.id);
  const packagesBlocks = collectPricedBlocks(blocks);

  const selectedPackages = normalizeSelectedPackages(quote.selected_packages);
  const addonQuantities = quote.selected_addons ?? {};

  const lines: InvoiceLineDraft[] = [];

  for (const { blockId, packages, addons } of packagesBlocks) {
    const selectedIds = selectedPackages[blockId] ?? [];
    for (const pkg of packages) {
      if (!selectedIds.includes(pkg.id)) continue;
      const amounts = buildLineAmounts(1, pkg.price, vatRate, quote.price_display);
      lines.push({ ...amounts, description: pkg.name, sourcePackageId: pkg.id, sourceAddonId: null });
    }
    for (const addon of addons) {
      const qty = addonQuantities[addon.id] ?? 0;
      if (qty <= 0) continue;
      const amounts = buildLineAmounts(qty, addon.price, vatRate, quote.price_display);
      lines.push({ ...amounts, description: addon.name, sourcePackageId: null, sourceAddonId: addon.id });
    }
  }

  return lines;
}
