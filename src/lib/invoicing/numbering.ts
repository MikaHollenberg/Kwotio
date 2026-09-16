import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

/**
 * Dunne wrapper rond de `next_invoice_number`-database-functie (migratie
 * 0048). Bewust NIET zelf een `select` gevolgd door een `update` -- dat is
 * een race condition bij gelijktijdige aanmaak vanuit twee tabbladen/
 * teamleden. De functie zelf doet een atomaire `select ... for update` +
 * `update` in één transactie.
 */
export async function getNextInvoiceNumber(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<{ invoiceNumber: string; invoiceYear: number }> {
  const { data, error } = await supabase.rpc("next_invoice_number", {
    p_organization_id: organizationId,
  });
  if (error) throw error;
  const row = data?.[0];
  if (!row) throw new Error("Kon geen factuurnummer genereren.");
  return { invoiceNumber: row.invoice_number, invoiceYear: row.invoice_year };
}
