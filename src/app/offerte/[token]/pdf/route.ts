import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadQuoteBlocks } from "@/lib/blocks/persistence";
import { calculateSubtotal, calculateTotal, defaultSelections, type Selections } from "@/lib/blocks/pricing";
import { PRICE_DISPLAY_LABELS } from "@/lib/blocks/price-display";
import { renderQuotePdf } from "@/lib/quote-pdf/quote-document";
import { resolvePreferredLogo } from "@/lib/organization/logo";
import { ALGEMENE_VOORWAARDEN_URL } from "@/lib/legal";
import type { PackagesBlockContent } from "@/lib/blocks/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data: quote } = await supabase
    .from("quotes")
    .select(
      "id, organization_id, client_id, title, currency, price_display, discount_amount, event_date, selected_package_id, selected_addons",
    )
    .eq("share_token", token)
    .maybeSingle();
  if (!quote) return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });

  const [{ data: organization }, { data: client }, blocks] = await Promise.all([
    supabase
      .from("organizations")
      .select("brand_name, logo_horizontal_url, logo_square_url, logo_preference")
      .eq("id", quote.organization_id)
      .single(),
    quote.client_id
      ? supabase.from("clients").select("name").eq("id", quote.client_id).single()
      : Promise.resolve({ data: null as { name: string } | null }),
    loadQuoteBlocks(supabase, quote.id),
  ]);

  const packagesBlock = blocks.find((b) => b.type === "packages");
  const packagesContent = packagesBlock?.content as PackagesBlockContent | undefined;

  const hasPriorSelection = quote.selected_package_id !== null || Object.keys(quote.selected_addons ?? {}).length > 0;
  const selections: Selections = hasPriorSelection
    ? { packageId: quote.selected_package_id, addonQuantities: (quote.selected_addons as Record<string, number>) ?? {} }
    : packagesContent
      ? defaultSelections(packagesContent.packages, packagesContent.addons)
      : { packageId: null, addonQuantities: {} };

  const subtotal = packagesContent
    ? calculateSubtotal(packagesContent.packages, packagesContent.addons, selections)
    : 0;
  const discountAmount = Number(quote.discount_amount);
  const total = calculateTotal({ subtotal, discountAmount });

  const pdf = await renderQuotePdf({
    organizationName: organization?.brand_name ?? "Feest aan het Water",
    organizationLogoUrl: organization ? resolvePreferredLogo(organization) : null,
    quoteTitle: quote.title,
    clientName: client?.name ?? "",
    eventDate: quote.event_date,
    currency: quote.currency,
    priceDisplayLabel: PRICE_DISPLAY_LABELS[quote.price_display],
    blocks,
    selections,
    subtotal,
    discountAmount,
    total,
    generatedAt: new Date().toISOString(),
    termsUrl: `${new URL(request.url).origin}${ALGEMENE_VOORWAARDEN_URL}`,
  });

  const safeTitle = quote.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase();

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="offerte-${safeTitle}.pdf"`,
    },
  });
}
