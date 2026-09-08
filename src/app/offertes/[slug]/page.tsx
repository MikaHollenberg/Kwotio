import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { KWOTIO_FAVICON } from "@/lib/app-config";
import { getPublicOrgPageData } from "./data";
import { checkRateLimit } from "@/lib/rate-limit";
import { PublicOrgPageView } from "./public-org-page-view";
import { logPageView } from "./analytics";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublicOrgPageData(slug);
  if (!data) return { title: "Pagina niet gevonden", robots: { index: false, follow: false }, icons: { icon: KWOTIO_FAVICON } };
  // In tegenstelling tot de privé /offerte/[token]-pagina's mag deze pagina
  // juist wél gevonden/gedeeld worden — daarom hier expliciet index: true
  // i.p.v. de noindex die de token-route gebruikt. `title.absolute` (i.p.v.
  // een kale string) negeert bewust het title-sjabloon uit het root-layout
  // ("%s · Caribbean Bar Uitgeest") — dit is de pagina van een ándere,
  // willekeurige organisatie, die mag nooit Caribbean Bar's merknaam
  // achter zijn eigen titel geplakt krijgen.
  const title = `Offertes van ${data.organizationName}`;
  const description = `Bekijk de beschikbare offertes van ${data.organizationName} en vraag direct een offerte aan.`;
  return {
    title: { absolute: title },
    description,
    robots: { index: true, follow: true },
    icons: { icon: KWOTIO_FAVICON },
    // De og:image zelf komt automatisch van opengraph-image.tsx in deze map
    // (Next.js file convention) — hier alleen titel/beschrijving/kaarttype.
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function PublicOrganizationPage({
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
      <div className="flex min-h-screen items-center justify-center bg-sand-100 px-6 text-center">
        <p className="text-sm text-ink-400">
          Even te veel verzoeken vanaf dit adres. Probeer het over een minuut opnieuw.
        </p>
      </div>
    );
  }

  const data = await getPublicOrgPageData(slug);
  if (!data) notFound();

  // Bewust ge-await (niet fire-and-forget): op een serverless platform kan
  // de functie na het versturen van de response afgebroken worden, waardoor
  // een niet-afgewachte log-insert soms stil zou wegvallen. logPageView faalt
  // zelf al stil bij een fout, dus dit blokkeert de weergave niet inhoudelijk.
  await logPageView(data.organizationId);

  return <PublicOrgPageView orgSlug={slug} data={data} />;
}
