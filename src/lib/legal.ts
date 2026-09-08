/** Vaste locatie van het privacybeleid — zie app/src/app/privacybeleid/page.tsx. */
export const PRIVACYBELEID_URL = "/privacybeleid";

/**
 * Permanent zichtbare disclaimer op de publieke organisatiepagina
 * (/offertes/[slug]) boven elke alleen-lezen templateweergave — de getoonde
 * prijzen zijn de echte template-prijzen (geen "vanaf"-bedragen), dus deze
 * tekst draagt de nuance dat de uiteindelijke offerte kan afwijken. Eén
 * centrale plek zodat Mika de bewoording later kan verfijnen.
 */
export const PUBLIC_PRICE_DISCLAIMER =
  "Deze pagina toont een indicatie van de prijs op basis van standaardopties. De daadwerkelijke offerte kan afwijken, bijvoorbeeld door maatwerk of extra wensen.";

/**
 * Centrale bron voor de voorwaarden-zin die overal getoond wordt waar naar
 * de algemene voorwaarden van een organisatie wordt verwezen (offerte-PDF,
 * ondertekeningscertificaat, e-mails aan klanten). Elke organisatie heeft
 * een eigen geüploade voorwaarden-PDF (`organizations.terms_url`) — is die
 * er niet, dan geeft deze functie `null` terug en laat de aanroeper de hele
 * zin weg (nooit terugvallen op een vaste/andere organisatie se tekst).
 *
 * Los van het (vrij invulbare) "Voorwaarden"-blok dat een bureau zelf in een
 * offerte kan zetten — dit is het juridische brondocument.
 *
 * De publieke offertepagina en het akkoord-vinkje bij ondertekenen gebruiken
 * i.p.v. deze functie hun eigen NL/EN-vertaalde varianten via
 * app/src/lib/i18n/translations.ts (die daar al door de taalwisselaar loopt)
 * — deze functie is voor de altijd-Nederlandse contexten: PDF's en e-mails.
 */
export function termsSentenceParts(
  organizationName: string,
  termsUrl: string | null,
): { prefix: string; linkText: string; suffix: string; url: string } | null {
  if (!termsUrl) return null;
  return {
    prefix: "Op deze offerte zijn de",
    linkText: "algemene voorwaarden",
    suffix: `van ${organizationName} van toepassing.`,
    url: termsUrl,
  };
}
