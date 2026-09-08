/**
 * Naam van het platform zelf (waarmee dit als SaaS-product verkocht wordt) —
 * uitsluitend voor systeemniveau-teksten vóór er sprake is van een
 * organisatie-context (bijv. de inlogschermen). Nooit gebruiken voor content
 * binnen een organisatie-account (dashboard, klantportaal, e-mails, PDF's) —
 * die blijven de eigen huisstijl/naam van die organisatie tonen.
 */
export const APP_NAME = "Kwotio";

/**
 * Kwotio's eigen favicon (twee komma-achtige vormen, zie kwotio-mark.tsx) —
 * gebruikt op systeemniveau-pagina's én, tot organisaties een eigen
 * opgeslagen icoon hebben, op elke publiek-toegankelijke pagina die geen
 * specifieke organisatie-context kán tonen (bv. de publieke
 * organisatiepagina van een andere, willekeurige klant dan Caribbean Bar —
 * die mag nooit Caribbean Bar's eigen zonnetje-icoon te zien krijgen).
 * Data-URI-vorm i.p.v. een icon.svg-conventiebestand: zie de toelichting in
 * app/(auth)/layout.tsx.
 */
export const KWOTIO_FAVICON =
  "data:image/svg+xml," +
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 80'>" +
  "<circle cx='38' cy='40' r='9' fill='%23B87F2A'/>" +
  "<polygon points='30,47 46,47 26,66' fill='%23B87F2A'/>" +
  "<circle cx='64' cy='40' r='9' fill='%23B87F2A'/>" +
  "<polygon points='56,47 72,47 52,66' fill='%23B87F2A'/>" +
  "</svg>";
