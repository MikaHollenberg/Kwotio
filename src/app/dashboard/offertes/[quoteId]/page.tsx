import { notFound } from "next/navigation";
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

  const { data: organization } = await supabase
    .from("organizations")
    .select("aantal_personen_actief")
    .eq("id", profile?.organization_id ?? quote.organization_id)
    .single();

  const [blocks, { data: comments }, { data: signature }, engagement] = await Promise.all([
    loadQuoteBlocks(supabase, quoteId),
    supabase.from("comments").select("*").eq("quote_id", quoteId).order("created_at", { ascending: true }),
    supabase
      .from("signatures")
      .select("*")
      .eq("quote_id", quoteId)
      .order("signed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    getQuoteEngagement(supabase, quoteId),
  ]);

  return (
    <QuoteEditor
      quote={quote}
      client={client}
      initialBlocks={blocks}
      initialComments={comments ?? []}
      signature={signature}
      engagement={engagement}
      organizationId={profile?.organization_id ?? quote.organization_id}
      orgHeadcountSettingActive={organization?.aantal_personen_actief ?? false}
    />
  );
}
