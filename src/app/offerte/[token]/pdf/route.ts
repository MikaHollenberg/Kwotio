import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadQuoteBlocks } from "@/lib/blocks/persistence";
import {
  calculateSubtotal,
  calculateTotal,
  defaultSelections,
  normalizeSelectedPackages,
  type Selections,
  type PackagesBlockInput,
} from "@/lib/blocks/pricing";
import { PRICE_DISPLAY_LABELS } from "@/lib/blocks/price-display";
import { renderQuotePdf, type QuotePdfSignatureData } from "@/lib/quote-pdf/quote-document";
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
      "id, organization_id, client_id, title, currency, price_display, price_per_person, discount_amount, event_date, selected_packages, selected_addons, client_display_name, client_display_email, client_display_phone, client_display_company, reference_number, handled_by_profile_id, status, aantal_personen",
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

  const selectedPackages = normalizeSelectedPackages(quote.selected_packages as Record<string, unknown> | null);
  const hasPriorSelection = Object.keys(selectedPackages).length > 0 || Object.keys(quote.selected_addons ?? {}).length > 0;
  const selections: Selections = hasPriorSelection
    ? { packageIdByBlock: selectedPackages, addonQuantities: (quote.selected_addons as Record<string, number>) ?? {} }
    : defaultSelections(packagesBlocksInput);

  const subtotal = calculateSubtotal(packagesBlocksInput, selections);
  const discountAmount = Number(quote.discount_amount);
  const total = calculateTotal({ subtotal, discountAmount });

  let signatureData: QuotePdfSignatureData | null = null;
  if (quote.status === "geaccepteerd") {
    const { data: signature } = await supabase
      .from("signatures")
      .select(
        "signer_name, signer_email, method, signature_image_url, typed_name, ip_address, user_agent, document_hash, signed_at, quote_version_id",
      )
      .eq("quote_id", quote.id)
      .order("signed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (signature) {
      const [{ data: version }, signatureImageDataUri] = await Promise.all([
        supabase.from("quote_versions").select("version_number").eq("id", signature.quote_version_id).maybeSingle(),
        signature.signature_image_url
          ? supabase.storage
              .from("quote-documents")
              .download(signature.signature_image_url)
              .then(async ({ data: file }) =>
                file ? `data:image/png;base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}` : null,
              )
          : Promise.resolve(null),
      ]);

      signatureData = {
        signerName: signature.signer_name,
        signerEmail: signature.signer_email,
        method: signature.method,
        typedName: signature.typed_name,
        ipAddress: signature.ip_address,
        userAgent: signature.user_agent,
        documentHash: signature.document_hash,
        signedAt: signature.signed_at,
        versionNumber: version?.version_number ?? 1,
        signatureImageDataUri,
        aantalPersonen: quote.aantal_personen,
      };
    }
  }

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
    signature: signatureData,
  });

  const safeTitle = quote.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase();

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="offerte-${safeTitle}.pdf"`,
    },
  });
}
