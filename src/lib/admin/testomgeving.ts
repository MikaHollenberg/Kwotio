import "server-only";

/**
 * De bestaande "Test Account (rondleiding)"-organisatie (Fase 11) wordt
 * hergebruikt als vrij te testen sandbox-omgeving vanuit het hoofdaccount —
 * geen nieuwe organisatie, geen nieuwe rommel. Vast e-mailadres van het
 * bijbehorende (enige) teamlid, gebruikt om er via een admin-gegenereerde
 * magic link een echte sessie voor op te zetten (zie ../../app/admin/
 * testomgeving/actions.ts) — geen wachtwoord nodig, dus geen aparte login.
 */
export const TEST_ORGANIZATION_ID = "c44486b7-22e9-4c1e-957b-d1f876d1393d";
export const TEST_ORGANIZATION_LOGIN_EMAIL = "test-rondleiding@kwotio.app";

/** Naam van de HttpOnly-cookie die de oorspronkelijke (super-admin-)sessie
 * tijdelijk bewaart terwijl je in de testomgeving zit, zodat "Terug naar
 * hoofdaccount" die kan herstellen zonder opnieuw in te loggen. */
export const ADMIN_RETURN_SESSION_COOKIE = "kw_admin_return_session";
