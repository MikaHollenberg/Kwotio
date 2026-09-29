/**
 * Naam van het platform zelf (waarmee dit als SaaS-product verkocht wordt) —
 * uitsluitend voor systeemniveau-teksten vóór er sprake is van een
 * organisatie-context (bijv. de inlogschermen). Nooit gebruiken voor content
 * binnen een organisatie-account (dashboard, klantportaal, e-mails, PDF's) —
 * die blijven de eigen huisstijl/naam van die organisatie tonen.
 */
export const APP_NAME = "Kwotio";

/**
 * Kwotio's eigen favicon (K-vinkje, zie kwotio-mark.tsx) — gebruikt op
 * systeemniveau-pagina's én, tot organisaties een eigen opgeslagen icoon
 * hebben, op elke publiek-toegankelijke pagina die geen specifieke
 * organisatie-context kán tonen (bv. de publieke organisatiepagina van een
 * andere, willekeurige klant dan Caribbean Bar — die mag nooit Caribbean
 * Bar's eigen zonnetje-icoon te zien krijgen).
 * Data-URI-vorm i.p.v. een icon.svg-conventiebestand: zie de toelichting in
 * app/(auth)/layout.tsx.
 */
export const KWOTIO_FAVICON =
  "data:image/svg+xml," +
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>" +
  "<rect x='6' y='6' width='88' height='88' rx='22' fill='none' stroke='%23B87F2A' stroke-width='7'/>" +
  "<polyline points='26,50 42,66 63,26' fill='none' stroke='%23B87F2A' stroke-width='10' stroke-linecap='round' stroke-linejoin='round'/>" +
  "<line x1='53.5' y1='44' x2='64.5' y2='66' stroke='%23B87F2A' stroke-width='10' stroke-linecap='round'/>" +
  "</svg>";
