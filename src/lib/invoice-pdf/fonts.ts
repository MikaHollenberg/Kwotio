import "server-only";
import path from "node:path";
import { Font } from "@react-pdf/renderer";

/**
 * Registreert Kwotio's eigen lettertypen (Bricolage Grotesque/Manrope,
 * zie app/src/app/globals.css) voor gebruik in de factuur-PDF. Google Fonts
 * levert deze alleen als variabel font -- @react-pdf/renderer werkt het
 * betrouwbaarst met vaste gewichten per bestand, vandaar de gevendorde
 * statische TTF's in ./fonts (Regular/Bold, opgehaald via Google Webfonts
 * Helper uit dezelfde Google Fonts-bron).
 *
 * Faalt dit om wat voor reden dan ook in een bepaalde omgeving (bv. de
 * bestanden ontbreken in een deploy), dan valt de PDF terug op de sowieso
 * al werkende ingebouwde Helvetica -- nooit een kapotte/halve PDF.
 */
let fontsRegistered = false;
let registrationAttempted = false;

export function registerInvoiceFonts(): boolean {
  if (registrationAttempted) return fontsRegistered;
  registrationAttempted = true;

  try {
    // process.cwd(), niet __dirname: Turbopack virtualiseert __dirname naar
    // een niet-bestaand "/ROOT/..."-pad in de gebundelde server-code (hier
    // zelf tegenaan gelopen -- ENOENT tijdens live testen), process.cwd()
    // blijft wel het echte, absolute pad op schijf.
    const fontsDir = path.join(process.cwd(), "src/lib/invoice-pdf/fonts");
    Font.register({
      family: "Bricolage Grotesque",
      fonts: [
        { src: path.join(fontsDir, "BricolageGrotesque-Regular.ttf"), fontWeight: 400 },
        { src: path.join(fontsDir, "BricolageGrotesque-Bold.ttf"), fontWeight: 700 },
      ],
    });
    Font.register({
      family: "Manrope",
      fonts: [
        { src: path.join(fontsDir, "Manrope-Regular.ttf"), fontWeight: 400 },
        { src: path.join(fontsDir, "Manrope-Bold.ttf"), fontWeight: 700 },
      ],
    });
    fontsRegistered = true;
  } catch (err) {
    console.error("[invoice-pdf] Kon eigen lettertypen niet laden, valt terug op Helvetica:", err);
    fontsRegistered = false;
  }

  return fontsRegistered;
}
