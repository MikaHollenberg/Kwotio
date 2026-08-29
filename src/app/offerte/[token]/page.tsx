import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { getQuoteByToken } from "@/lib/public-quote/data";
import { resolvePreferredLogo } from "@/lib/organization/logo";
import { hasAccessCookie } from "./actions";
import { AccessGate } from "./access-gate";
import { PublicQuoteView } from "./public-quote-view";
import { checkRateLimit } from "@/lib/rate-limit";
import type { CommentItem } from "@/components/preview/comment-thread";
import type { Selections } from "@/lib/blocks/pricing";
import type { Lang } from "@/lib/i18n/translations";
import type { QuoteHeaderData } from "@/components/preview/quote-header";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const data = await getQuoteByToken(token);
  // Offertes bevatten klant- en prijsgegevens en zijn alleen bedoeld voor wie
  // de link heeft — nooit indexeren, ook niet als de link ooit ergens extern
  // gedeeld/gelinkt wordt.
  const robots = { index: false, follow: false };
  if (!data) return { title: "Offerte", robots };
  return { title: data.quote.title, robots };
}

export default async function PublicQuotePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Per-IP limiet (niet per token) — vangt geautomatiseerd langslopen van
  // veel verschillende tokens vanaf hetzelfde adres af. De token zelf is al
  // 192-bit willekeurig en dus praktisch niet te raden; dit is extra
  // bescherming tegen scraping/misbruik, geen kernverdediging.
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "onbekend";
  const { allowed } = await checkRateLimit("offerte_view", ip, { max: 60, windowSeconds: 60 });
  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sand-100 px-6 text-center">
        <p className="text-sm text-ink-400">
          Even te veel verzoeken vanaf dit adres. Probeer het over een minuut opnieuw.
        </p>
      </div>
    );
  }

  const data = await getQuoteByToken(token);
  if (!data) notFound();

  const { quote, client, blocks, comments } = data;
  const initialLang: Lang = quote.language === "en" ? "en" : "nl";

  if (quote.access_code) {
    const unlocked = await hasAccessCookie(token);
    if (!unlocked) return <AccessGate token={token} lang={initialLang} />;
  }

  const commentsByBlock: Record<string, CommentItem[]> = {};
  for (const c of comments) {
    if (!c.block_id) continue;
    (commentsByBlock[c.block_id] ??= []).push({
      id: c.id,
      authorType: c.author_type,
      authorName: c.author_name,
      body: c.body,
      createdAt: c.created_at,
    });
  }

  const selectedPackageId = quote.selected_package_id ?? null;
  const selectedAddons = quote.selected_addons ?? {};
  const hasPriorSelection = selectedPackageId !== null || Object.keys(selectedAddons).length > 0;
  const initialSelections: Selections | undefined = hasPriorSelection
    ? { packageId: selectedPackageId, addonQuantities: selectedAddons as Record<string, number> }
    : undefined;

  const isExpired = !!quote.valid_until && new Date(quote.valid_until) < new Date(new Date().toDateString());

  const orgAddress = data.organization.address as
    | { street?: string; postalCode?: string; city?: string; country?: string }
    | null;
  const headerData: QuoteHeaderData = {
    organizationName: data.organization.brand_name,
    organizationLogoUrl: resolvePreferredLogo(data.organization),
    organizationAddress: orgAddress,
    organizationKvk: data.organization.kvk_number,
    organizationBtw: data.organization.btw_number,
    organizationEmail: data.organization.contact_email,
    organizationPhone: data.organization.contact_phone,
    handledByName: data.handledByName,
    clientName: quote.client_display_name,
    clientEmail: quote.client_display_email,
    clientPhone: quote.client_display_phone,
    clientCompany: quote.client_display_company,
    referenceNumber: quote.reference_number,
  };

  return (
    <PublicQuoteView
      token={token}
      blocks={blocks}
      initialLang={initialLang}
      status={quote.status}
      isExpired={isExpired}
      initialSelections={initialSelections}
      commentsByBlock={commentsByBlock}
      logoUrl={resolvePreferredLogo(data.organization)}
      organizationName={data.organization.brand_name}
      termsUrl={data.organization.terms_url}
      headcountRequired={quote.aantal_personen_actief}
      headcountNote={data.organization.aantal_personen_kanttekening}
      headerData={headerData}
      meta={{
        title: quote.title,
        clientName: client?.name ?? "",
        eventDate: quote.event_date,
        currency: quote.currency,
        priceDisplay: quote.price_display,
        discountAmount: Number(quote.discount_amount),
      }}
    />
  );
}
