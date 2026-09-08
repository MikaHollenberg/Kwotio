import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { getPublicOrgPageData } from "./data";
import { checkRateLimit } from "@/lib/rate-limit";
import { PublicOrgPageView } from "./public-org-page-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublicOrgPageData(slug);
  if (!data) return { title: "Pagina niet gevonden", robots: { index: false, follow: false } };
  // In tegenstelling tot de privé /offerte/[token]-pagina's mag deze pagina
  // juist wél gevonden/gedeeld worden — daarom hier expliciet index: true
  // i.p.v. de noindex die de token-route gebruikt.
  return {
    title: `Offertes van ${data.organizationName}`,
    description: `Bekijk de beschikbare offertes van ${data.organizationName} en vraag direct een offerte aan.`,
    robots: { index: true, follow: true },
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

  return <PublicOrgPageView orgSlug={slug} data={data} />;
}
