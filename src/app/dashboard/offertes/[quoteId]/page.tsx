import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { loadQuoteBlocks } from "@/lib/blocks/persistence";
import { getQuoteEngagement } from "@/lib/stats/queries";
import { isInvoicingEnabled } from "@/lib/invoicing/feature-flag";
import type { ArrangementPickerSummary } from "@/lib/arrangements/types";
import { QuoteEditor } from "./quote-editor";

export default async function QuoteEditorPage({
  params,
}: {
  params: Promise<{ quoteId: string }>;
}) {
  const { quoteId } = await params;
  const supabase = await createClient();
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;

  const [{ data: quote }, { data: userData }] = await Promise.all([
    supabase.from("quotes").select("*").eq("id", quoteId).maybeSingle(),
    supabase.auth.getUser(),
  ]);

  if (!quote) notFound();

  const [{ data: profile }, { data: client }] = await Promise.all([
    supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", userData.user?.id ?? "")
      .single(),
    quote.client_id
      ? supabase.from("clients").select("id, name, email").eq("id", quote.client_id).single()
      : Promise.resolve({ data: null }),
  ]);

  const organizationId = profile?.organization_id ?? quote.organization_id;

  const [{ data: organization }, { data: teamMembers }] = await Promise.all([
    supabase
      .from("organizations")
      .select(
        "aantal_personen_actief, brand_name, logo_horizontal_url, logo_square_url, logo_preference, address, kvk_number, btw_number, contact_email, contact_phone",
      )
      .eq("id", organizationId)
      .single(),
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("organization_id", organizationId)
      .order("full_name", { ascending: true }),
  ]);

  const [
    blocks,
    { data: comments },
    { data: contactLogs },
    { data: signature },
    engagement,
    { data: blockTemplates },
    { count: slotfactuurCount },
    { data: arrangementRows },
  ] = await Promise.all([
    loadQuoteBlocks(supabase, quoteId),
    supabase.from("comments").select("*").eq("quote_id", quoteId).order("created_at", { ascending: true }),
    supabase.from("quote_contact_logs").select("*").eq("quote_id", quoteId).order("created_at", { ascending: true }),
    supabase
      .from("signatures")
      .select("*")
      .eq("quote_id", quoteId)
      .order("signed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    getQuoteEngagement(supabase, quoteId),
    supabase
      .from("block_templates")
      .select("id, type, name, content")
      .eq("organization_id", organizationId)
      .order("name", { ascending: true }),
    supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("quote_id", quoteId)
      .eq("type", "slotfactuur"),
    supabase
      .from("arrangements")
      .select(
        "id, name, description, category, color_code, base_price, pricing_mode, price_per_person, price_display, content_items, pdf_url",
      )
      .eq("organization_id", organizationId)
      .is("archived_at", null)
      .order("sort_order", { ascending: true }),
  ]);

  const arrangementIds = (arrangementRows ?? []).map((a) => a.id);
  const [{ data: tierRows }, { data: seasonRows }] =
    arrangementIds.length > 0
      ? await Promise.all([
          supabase
            .from("arrangement_price_tiers")
            .select("id, arrangement_id, min_guests, max_guests, price")
            .in("arrangement_id", arrangementIds)
            .order("sort_order", { ascending: true }),
          supabase
            .from("arrangement_season_prices")
            .select("id, arrangement_id, label, start_date, end_date, price")
            .in("arrangement_id", arrangementIds)
            .order("sort_order", { ascending: true }),
        ])
      : [{ data: [] }, { data: [] }];

  const arrangements: ArrangementPickerSummary[] = (arrangementRows ?? []).map((a) => ({
    id: a.id,
    name: a.name,
    description: a.description,
    category: a.category,
    colorCode: a.color_code,
    pricingMode: a.pricing_mode,
    basePrice: Number(a.base_price),
    pricePerPerson: a.price_per_person,
    priceDisplay: a.price_display,
    contentItems: a.content_items,
    pdfUrl: a.pdf_url,
    tiers: (tierRows ?? [])
      .filter((t) => t.arrangement_id === a.id)
      .map((t) => ({ id: t.id, minGuests: t.min_guests, maxGuests: t.max_guests, price: Number(t.price) })),
    seasons: (seasonRows ?? [])
      .filter((s) => s.arrangement_id === a.id)
      .map((s) => ({ id: s.id, label: s.label, startDate: s.start_date, endDate: s.end_date, price: Number(s.price) })),
  }));

  return (
    <QuoteEditor
      origin={origin}
      quote={quote}
      client={client}
      initialBlocks={blocks}
      initialComments={comments ?? []}
      initialContactLogs={contactLogs ?? []}
      signature={signature}
      engagement={engagement}
      organizationId={organizationId}
      orgHeadcountSettingActive={organization?.aantal_personen_actief ?? false}
      organization={organization ?? null}
      teamMembers={(teamMembers ?? []).map((m) => ({ id: m.id, name: m.full_name || m.email }))}
      initialBlockTemplates={blockTemplates ?? []}
      initialArrangements={arrangements}
      hasSlotfactuur={(slotfactuurCount ?? 0) > 0}
      invoicingEnabled={isInvoicingEnabled(organizationId)}
    />
  );
}
