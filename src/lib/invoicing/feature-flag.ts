import "server-only";
import { TEST_ORGANIZATION_ID } from "@/lib/admin/testomgeving";

/**
 * De facturen-/administratiemodule (BTW-aangifte) is op verzoek van de
 * gebruiker tijdelijk gepauzeerd voor echte organisaties — alle code blijft
 * gewoon staan (server actions, RLS, PDF's, e-mails), alleen de toegang is
 * dichtgezet. De testorganisatie (zie lib/admin/testomgeving.ts) houdt 'm
 * wel, zodat er verder getest kan worden.
 *
 * Weer overal aanzetten: voeg de organization_id(s) toe die 'm mogen zien,
 * of vervang de functie door `() => true`.
 */
const INVOICING_ENABLED_ORG_IDS: readonly string[] = [TEST_ORGANIZATION_ID];

export function isInvoicingEnabled(organizationId: string | null | undefined): boolean {
  return !!organizationId && INVOICING_ENABLED_ORG_IDS.includes(organizationId);
}
