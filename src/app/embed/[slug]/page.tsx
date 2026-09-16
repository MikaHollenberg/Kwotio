import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { KWOTIO_FAVICON } from "@/lib/app-config";
import { getPublicOrgPageData } from "../../offertes/[slug]/data";
import { checkRateLimit } from "@/lib/rate-limit";
import { PublicOrgPageView } from "../../offertes/[slug]/public-org-page-view";
import { logPageView } from "../../offertes/[slug]/analytics";

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
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

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
      <PublicOrgPageView orgSlug={slug} data={data} embed />
    </>
  );
}
