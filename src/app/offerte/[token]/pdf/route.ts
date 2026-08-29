import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadQuoteBlocks } from "@/lib/blocks/persistence";
import {
  calculateSubtotal,
  calculateTotal,
  defaultSelections,
  type Selections,
  type PackagesBlockInput,
} from "@/lib/blocks/pricing";
import { PRICE_DISPLAY_LABELS } from "@/lib/blocks/price-display";
import { renderQuotePdf } from "@/lib/quote-pdf/quote-document";
import { resolvePreferredLogo } from "@/lib/organization/logo";
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
      "id, organization_id, client_id, title, currency, price_display, price_per_person, discount_amount, event_date, selected_packages, selected_addons, client_display_name, client_display_email, client_display_phone, client_display_company, reference_number, handled_by_profile_id",
    )
    .eq("share_token", token)
    .maybeSingle();
  if (!quote) return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });

  const [{ data: organization }, { data: handledBy }, blocks] = await Promise.all([
    supabase
      .from("organizations")
      .select(
        "brand_name, logo_horizontal_url, logo_square_url, logo_preference, terms_url, address, kvk_number, btw_number, contact_email, contact_phone",
      )
      .eq("id", quote.organization_id)
      .single(),
    quote.handled_by_profile_id
      ? supabase.from("profiles").select("full_name, email").eq("id", quote.handled_by_profile_id).maybeSingle()
      : Promise.resolve({ data: null as { full_name: string | null; email: string } | null }),
    loadQuoteBlocks(supabase, quote.id),
  ]);

  const packagesBlocksInput: PackagesBlockInput[] = blocks
    .filter((b) => b.type === "packages")
    .map((b) => {
      const content = b.content as PackagesBlockContent;
      return { blockId: b.id, packages: content.packages, addons: content.addons };
    });

  const selectedPackages = (quote.selected_packages as Record<string, string | null>) ?? {};
  const hasPriorSelection = Object.keys(selectedPackages).length > 0 || Object.keys(quote.selected_addons ?? {}).length > 0;
  const selections: Selections = hasPriorSelection
    ? { packageIdByBlock: selectedPackages, addonQuantities: (quote.selected_addons as Record<string, number>) ?? {} }
    : defaultSelections(packagesBlocksInput);

  const subtotal = calculateSubtotal(packagesBlocksInput, selections);
  const discountAmount = Number(quote.discount_amount);
  const total = calculateTotal({ subtotal, discountAmount });

  const pdf = await renderQuotePdf({
    organizationName: organization?.brand_name ?? "Feest aan het Water",
    organizationLogoUrl: organization ? resolvePreferredLogo(organization) : null,
    organizationAddress: organization?.address as
      | { street?: string; postalCode?: string; city?: string; country?: string }
      | null,
    organizationKvk: organization?.kvk_number ?? null,
    organizationBtw: organization?.btw_number ?? null,
    organizationEmail: organization?.contact_email ?? null,
    organizationPhone: organization?.contact_phone ?? null,
    handledByName: handledBy?.full_name || handledBy?.email || null,
    quoteTitle: quote.title,
    clientName: quote.client_display_name ?? "",
    clientEmail: quote.client_display_email,
    clientPhone: quote.client_display_phone,
    clientCompany: quote.client_display_company,
    referenceNumber: quote.reference_number,
    eventDate: quote.event_date,
    currency: quote.currency,
    priceDisplayLabel: PRICE_DISPLAY_LABELS[quote.price_display],
    pricePerPerson: quote.price_per_person,
    blocks,
    selections,
    subtotal,
    discountAmount,
    total,
    generatedAt: new Date().toISOString(),
    termsUrl: organization?.terms_url ?? null,
  });

  const safeTitle = quote.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase();

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="offerte-${safeTitle}.pdf"`,
    },
  });
}
