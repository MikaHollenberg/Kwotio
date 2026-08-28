"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getQuoteByToken } from "@/lib/public-quote/data";
import { hashSnapshot } from "@/lib/signing/hash";
import { renderCertificatePdf } from "@/lib/signing/pdf-certificate";
import { calculateSubtotal, calculateTotal, type Selections } from "@/lib/blocks/pricing";
import type { PackagesBlockContent } from "@/lib/blocks/types";
import { sendEmail } from "@/lib/email/client";
import { signingConfirmationClientEmail, signingNotificationAgencyEmail } from "@/lib/email/templates/signing";
import { PRICE_DISPLAY_LABELS } from "@/lib/blocks/price-display";
import { PRIVACYBELEID_URL } from "@/lib/legal";

export type SignQuoteInput = {
  signerName: string;
  signerEmail: string;
  signatureDataUrl: string;
  selections: Selections;
  aantalPersonen: number | null;
};

export type SignQuoteResult = { ok: true } | { ok: false; error: string };

export async function signQuote(token: string, input: SignQuoteInput): Promise<SignQuoteResult> {
  const data = await getQuoteByToken(token);
  if (!data) return { ok: false, error: "Offerte niet gevonden." };
  const { quote, organization, client, blocks } = data;

  if (quote.status === "geaccepteerd") {
    return { ok: false, error: "Deze offerte is al ondertekend." };
  }
  if (quote.valid_until && new Date(quote.valid_until) < new Date(new Date().toDateString())) {
    return { ok: false, error: "Deze offerte is verlopen en kan niet meer ondertekend worden. Neem contact op voor een actuele versie." };
  }
  if (!input.signerName.trim() || !input.signerEmail.trim()) {
    return { ok: false, error: "Naam en e-mailadres zijn verplicht." };
  }
  if (!input.signatureDataUrl) {
    return { ok: false, error: "Teken je handtekening voordat je bevestigt." };
  }
  if (quote.aantal_personen_actief && (input.aantalPersonen == null || input.aantalPersonen < 1)) {
    return { ok: false, error: "Vul het aantal personen in voordat je bevestigt." };
  }

  const supabase = createAdminClient();
  const h = await headers();
  const ipAddress = h.get("x-forwarded-for") ?? "onbekend";
  const userAgent = h.get("user-agent") ?? "onbekend";

  const packagesBlock = blocks.find((b) => b.type === "packages");
  const packagesContent = packagesBlock?.content as PackagesBlockContent | undefined;
  const subtotal = packagesContent
    ? calculateSubtotal(packagesContent.packages, packagesContent.addons, input.selections)
    : 0;
  const total = calculateTotal({ subtotal, discountAmount: Number(quote.discount_amount) });
  const selectedPackage = packagesContent?.packages.find((p) => p.id === input.selections.packageId);

  const snapshot = {
    quoteId: quote.id,
    title: quote.title,
    currency: quote.currency,
    priceDisplay: quote.price_display,
    discountAmount: Number(quote.discount_amount),
    blocks,
    selections: input.selections,
    total,
    termsAccepted: true,
    termsUrl: organization.terms_url,
  };
  const documentHash = hashSnapshot(snapshot);

  const { count: versionCount } = await supabase
    .from("quote_versions")
    .select("id", { count: "exact", head: true })
    .eq("quote_id", quote.id);
  const versionNumber = (versionCount ?? 0) + 1;

  const { data: version, error: versionError } = await supabase
    .from("quote_versions")
    .insert({
      quote_id: quote.id,
      version_number: versionNumber,
      snapshot,
      total,
      reason: "signed",
    })
    .select("id")
    .single();
  if (versionError) return { ok: false, error: "Kon offerteversie niet vastleggen." };

  const signatureId = randomUUID();
  const signatureImagePath = `${quote.organization_id}/signatures/${signatureId}.png`;
  const base64 = input.signatureDataUrl.replace(/^data:image\/png;base64,/, "");
  const buffer = Buffer.from(base64, "base64");
  const { error: uploadError } = await supabase.storage
    .from("quote-documents")
    .upload(signatureImagePath, buffer, { contentType: "image/png", upsert: true });
  if (uploadError) return { ok: false, error: "Kon handtekening niet opslaan." };

  const { error: signatureError } = await supabase.from("signatures").insert({
    id: signatureId,
    quote_id: quote.id,
    quote_version_id: version.id,
    signer_name: input.signerName.trim(),
    signer_email: input.signerEmail.trim(),
    method: "canvas",
    signature_image_url: signatureImagePath,
    typed_name: null,
    ip_address: ipAddress,
    user_agent: userAgent,
    document_hash: documentHash,
  });
  if (signatureError) return { ok: false, error: "Kon handtekening niet vastleggen." };

  const certificatePdf = await renderCertificatePdf({
    organizationName: organization.brand_name,
    quoteTitle: quote.title,
    clientName: client?.name ?? input.signerName,
    selectedPackageName: selectedPackage?.name ?? null,
    total,
    currency: quote.currency,
    priceDisplayLabel: PRICE_DISPLAY_LABELS[quote.price_display],
    signerName: input.signerName.trim(),
    signerEmail: input.signerEmail.trim(),
    method: "canvas",
    typedName: null,
    ipAddress,
    userAgent,
    documentHash,
    signedAt: new Date().toISOString(),
    versionNumber,
    termsUrl: organization.terms_url,
    aantalPersonen: input.aantalPersonen,
  });

  const certificatePath = `${quote.organization_id}/certificates/${signatureId}.pdf`;
  await supabase.storage
    .from("quote-documents")
    .upload(certificatePath, certificatePdf, { contentType: "application/pdf", upsert: true });
  await supabase.from("signatures").update({ certificate_pdf_url: certificatePath }).eq("id", signatureId);

  await supabase
    .from("quotes")
    .update({
      status: "geaccepteerd",
      selected_package_id: input.selections.packageId,
      selected_addons: input.selections.addonQuantities,
      subtotal,
      total,
      aantal_personen: input.aantalPersonen,
    })
    .eq("id", quote.id);

  await supabase.from("activity_events").insert({
    quote_id: quote.id,
    type: "signed",
    metadata: { signatureId, method: "canvas" },
    ip_address: ipAddress,
    user_agent: userAgent,
  });

  const shareUrl = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}/offerte/${token}`;

  await sendEmail({
    to: input.signerEmail.trim(),
    subject: `Bevestiging: je hebt "${quote.title}" ondertekend`,
    html: signingConfirmationClientEmail({
      organizationName: organization.brand_name,
      quoteTitle: quote.title,
      signerName: input.signerName.trim(),
      total,
      currency: quote.currency,
      shareUrl,
      termsUrl: organization.terms_url,
      privacyUrl: `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}${PRIVACYBELEID_URL}`,
    }),
    attachments: [{ filename: "ondertekeningscertificaat.pdf", content: certificatePdf }],
  });

  if (quote.created_by) {
    const { data: creatorProfile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", quote.created_by)
      .maybeSingle();
    if (creatorProfile?.email) {
      await sendEmail({
        to: creatorProfile.email,
        subject: `${input.signerName.trim()} heeft "${quote.title}" ondertekend`,
        html: signingNotificationAgencyEmail({
          organizationName: organization.brand_name,
          quoteTitle: quote.title,
          signerName: input.signerName.trim(),
          signerEmail: input.signerEmail.trim(),
          total,
          currency: quote.currency,
          dashboardUrl: `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}/dashboard/offertes/${quote.id}`,
        }),
        attachments: [{ filename: "ondertekeningscertificaat.pdf", content: certificatePdf }],
      });
    }
  }

  revalidatePath(`/offerte/${token}`);
  revalidatePath(`/dashboard/offertes/${quote.id}`);

  return { ok: true };
}
