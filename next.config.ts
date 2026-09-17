import type { NextConfig } from "next";

const supabaseHostname = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : null;
  } catch {
    return null;
  }
})();

// Klikjacking-/MIME-sniffing-bescherming + strengere referrer/permissions-
// policy op elke pagina.
const SAFE_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

// X-Frame-Options + CSP frame-ancestors: DENY overal BEHALVE /embed/* -- die
// route is met opzet bedoeld om in een <iframe> op de eigen website van een
// organisatie ingeladen te worden (het aanvraagformulier-embed-widget, zie
// Fase 12). Next.js' headers()-matcher kent geen "alles behalve"-patroon,
// dus expliciet per route-groep i.p.v. een wildcard die per ongeluk ook
// /embed zou raken.
const FRAME_PROTECTED_SOURCES = [
  "/",
  "/dashboard/:path*",
  "/admin/:path*",
  "/login",
  "/wachtwoord-vergeten",
  "/wachtwoord-herstellen",
  "/privacybeleid",
  "/offerte/:path*",
  "/offertes/:path*",
];

// Content-Security-Policy -- pas toegevoegd ná grondig uitzoeken wat de app
// daadwerkelijk laadt (zie git-geschiedenis voor het onderzoek), bewust
// zonder nonce/proxy-aanpak:
// - `style-src` heeft 'unsafe-inline' nodig: de organisatie-accentkleur
//   (huisstijl per klant) wordt door de hele klant-facing offertepagina/
//   dashboard heen als `style={{backgroundColor: accentColor}}` toegepast --
//   dat zijn HTML `style="..."`-attributen, geen `<style>`-tags, en een CSP-
//   nonce werkt alleen op tags, nooit op attributen. Dat zou honderden
//   plekken vergen om naar CSS-variabelen om te bouwen; een bewuste,
//   gangbare afweging (script-src blijft wél strak, dat is de gevaarlijke
//   kant van XSS).
// - `script-src` krijgt WEL 'unsafe-inline' i.p.v. een nonce: een nonce
//   vereist dat proxy.ts op élke pagina draait (incl. /offerte/[token], nu
//   bewust uitgesloten van de matcher om de auth-lookup op de
//   drukst-bezochte publieke pagina te vermijden) én dwingt elke pagina tot
//   dynamic rendering. Dat risico op een stille productieregressie (bv.
//   hydratie die breekt op een pagina die niet grondig getest is) weegt hier
//   zwaarder dan de marginale extra bescherming t.o.v. de sanitization die
//   al aan de bron zit (DOMPurify op offerte-blokken, textToSafeHtml() in
//   alle e-mails) -- CSP is hier bewust een extra laag, niet de eerste
//   verdedigingslinie.
// - `img-src`/`connect-src` staan het eigen Supabase-project toe (Storage-
//   afbeeldingen resp. de browser-Supabase-client voor auth/uploads,
//   zie image-upload-field.tsx/pdf-upload-field.tsx) + `data:`/`blob:` voor
//   de handtekening-canvas (signature-pad.tsx, `toDataURL()`) en QR-codes.
// - `font-src 'self'` volstaat: `next/font/google` host de Google Fonts zelf
//   al op build-time, er gaat nooit een live request naar fonts.googleapis.com.
// - Mollie heeft geen eigen CSP-regel nodig: de app roept Mollie alleen
//   server-side aan (REST API); de klant navigeert met een gewone link naar
//   Mollie's hosted checkout, dat is geen fetch/iframe en valt dus niet
//   onder CSP.
function buildCsp({ includeFrameAncestors }: { includeFrameAncestors: boolean }) {
  const isDev = process.env.NODE_ENV !== "production";
  const supabaseOrigins = [supabaseHostname ? `https://${supabaseHostname}` : null, "https://*.supabase.co"].filter(
    Boolean,
  );

  const directives = [
    `default-src 'self'`,
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: ${supabaseOrigins.join(" ")}`,
    `font-src 'self'`,
    `connect-src 'self' ${supabaseOrigins.join(" ")}`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    ...(includeFrameAncestors ? [`frame-ancestors 'none'`] : []),
    `upgrade-insecure-requests`,
  ];
  return directives.join("; ");
}

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [...SAFE_HEADERS, { key: "Content-Security-Policy", value: buildCsp({ includeFrameAncestors: false }) }],
      },
      ...FRAME_PROTECTED_SOURCES.map((source) => ({
        source,
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: buildCsp({ includeFrameAncestors: true }) },
        ],
      })),
    ];
  },
  // De factuur-PDF laadt Kwotio's eigen lettertypen (Bricolage Grotesque/
  // Manrope) als losse TTF-bestanden vanaf schijf (zie
  // src/lib/invoice-pdf/fonts.ts) i.p.v. via een import -- Next.js'
  // automatische file-tracing voor Vercel-serverless-functies pikt zulke
  // pas-op-runtime-berekende paden niet vanzelf op, dus expliciet
  // meegeven zodat de fonts ook in productie meegedeployed worden.
  outputFileTracingIncludes: {
    "/dashboard/facturen/**": ["./src/lib/invoice-pdf/fonts/**/*"],
  },
  experimental: {
    // Turbopack's persistente filesystem-cache voor `next dev` (standaard
    // aan sinds Next 16.1) schrijft een eigen databasebestand naar
    // .next/dev/cache/turbopack -- op dit externe/exFAT-volume corrumpeert
    // dat bestand herhaaldelijk ("Failed to open database... invalid digit
    // found in string"), soms al bij de eerstvolgende herstart. `next dev`
    // draait nooit op Vercel (alleen lokaal), dus dit uitzetten raakt de
    // productie-build op Vercel niet -- lokaal alleen een iets kouder
    // opstartmoment per herstart, in ruil voor het definitief stoppen van
    // deze steeds terugkerende cache-corruptie.
    turbopackFileSystemCacheForDev: false,
  },
  images: {
    // De on-the-fly sharp-optimalisatiepijplijn faalt stil in lokale dev op
    // dit externe/exFAT-volume (gecorrumpeerde cache-writes) — zie
    // node_modules/next se "Slow filesystem detected"-waarschuwing. Op
    // Vercel (productie) speelt dit niet, dus daar willen we wél de volledige
    // next/image-optimalisatie voor de foto-rijke offertepagina's (Fase 7).
    unoptimized: process.env.NODE_ENV !== "production",
    remotePatterns: [
      ...(supabaseHostname
        ? [{ protocol: "https" as const, hostname: supabaseHostname, pathname: "/storage/v1/object/public/**" }]
        : []),
      { protocol: "https" as const, hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
};

export default nextConfig;
