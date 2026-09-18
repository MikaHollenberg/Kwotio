import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { loadQuoteBlocks } from "@/lib/blocks/persistence";
import { getQuoteEngagement } from "@/lib/stats/queries";
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

  const [blocks, { data: comments }, { data: contactLogs }, { data: signature }, engagement, { data: blockTemplates }, { count: slotfactuurCount }] =
    await Promise.all([
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
    ]);

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
      hasSlotfactuur={(slotfactuurCount ?? 0) > 0}
    />
  );
}
