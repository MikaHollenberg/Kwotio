import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { Poppins, Lato } from "next/font/google";
import { KWOTIO_FAVICON } from "@/lib/app-config";
import { getPublicOrgPageData } from "../../offertes/[slug]/data";
import { checkRateLimit } from "@/lib/rate-limit";
import { PublicOrgPageView } from "../../offertes/[slug]/public-org-page-view";
import { logPageView } from "../../offertes/[slug]/analytics";

// Optionele lettertype-set voor de embed (?fonts=poppins-lato), zodat de
// ingesloten pagina visueel aansluit op de eigen website van een organisatie.
// next/font host de bestanden zelf (CSP staat alleen font-src 'self' toe) en
// preload staat uit: de bestanden worden alleen opgehaald als ze gebruikt worden.
const poppins = Poppins({ weight: ["500", "600", "700"], subsets: ["latin"], variable: "--font-embed-poppins", preload: false });
const lato = Lato({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-embed-lato", preload: false });

/**
 * Kale <iframe>-variant van de publieke offertepagina (/offertes/[slug]) --
 * zelfde data/formulier, alleen zonder de omliggende paginachrome, bedoeld
 * om op de eigen website van een organisatie ingesloten te worden (zie
 * public/embed.js voor het bijbehorende auto-hoogte-scriptje). Nooit
 * bedoeld om los bezocht te worden, dus expliciet noindex.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublicOrgPageData(slug);
  const title = data ? `Offertes van ${data.organizationName}` : "Pagina niet gevonden";
  return {
    title: { absolute: title },
    robots: { index: false, follow: false },
    icons: { icon: KWOTIO_FAVICON },
  };
}

export default async function EmbeddedOrganizationPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ fonts?: string }>;
}) {
  const { slug } = await params;
  const { fonts } = await searchParams;
  const useWebsiteFonts = fonts === "poppins-lato";

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "onbekend";
  const { allowed } = await checkRateLimit("public_org_page", ip, { max: 120, windowSeconds: 60 });
  if (!allowed) {
    return (
      <p className="p-4 text-center text-sm text-ink-400">
        Even te veel verzoeken vanaf dit adres. Probeer het over een minuut opnieuw.
      </p>
    );
  }

  const data = await getPublicOrgPageData(slug);
  if (!data) notFound();

  await logPageView(data.organizationId);

  return (
    <>
      {/* Het root-layout (app/layout.tsx, gedeeld door de hele site) zet
          min-h-full/flex op <body> zodat een normale pagina altijd het volle
          scherm vult -- precies verkeerd voor deze embed, die moet juist zo
          kort mogelijk zijn (de iframe volgt exact de inhoud, zie
          public/embed.js). Een geneste layout kan <body> niet overschrijven
          (één <html>/<body> voor de hele app), dus reset dit hier lokaal. */}
      <style>{`html, body { height: auto; min-height: 0; }`}</style>
      {useWebsiteFonts ? (
        <div
          className={`${poppins.variable} ${lato.variable} font-sans`}
          style={
            {
              "--font-display": 'var(--font-embed-poppins), "Poppins", ui-sans-serif, system-ui, sans-serif',
              "--font-sans": 'var(--font-embed-lato), "Lato", ui-sans-serif, system-ui, sans-serif',
              fontFamily: 'var(--font-embed-lato), "Lato", ui-sans-serif, system-ui, sans-serif',
            } as React.CSSProperties
          }
        >
          <PublicOrgPageView orgSlug={slug} data={data} embed />
        </div>
      ) : (
        <PublicOrgPageView orgSlug={slug} data={data} embed />
      )}
    </>
  );
}
