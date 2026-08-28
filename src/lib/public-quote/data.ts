import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadQuoteBlocks } from "@/lib/blocks/persistence";
import type { Database } from "@/lib/types/database";

type Quote = Database["public"]["Tables"]["quotes"]["Row"];
type Organization = Database["public"]["Tables"]["organizations"]["Row"];
type ClientRow = Database["public"]["Tables"]["clients"]["Row"];
type Comment = Database["public"]["Tables"]["comments"]["Row"];

export type PublicQuoteData = {
  quote: Quote;
  organization: Organization;
  client: ClientRow | null;
  blocks: Awaited<ReturnType<typeof loadQuoteBlocks>>;
  comments: Comment[];
};

/**
 * Enige toegangspad voor de publieke offertepagina: alles wordt opgezocht
 * via het share_token (de "sleutel"), nooit via een los meegegeven quoteId.
 * Gebruikt de service-role client — dus zorgvuldig scopen op het token.
 */
export async function getQuoteByToken(token: string): Promise<PublicQuoteData | null> {
  const supabase = createAdminClient();

  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .select("*")
    .eq("share_token", token)
    .maybeSingle();
  if (quoteError) throw quoteError;
  if (!quote) return null;

  const [{ data: organization, error: orgError }, { data: client, error: clientError }, { data: comments, error: commentsError }] =
    await Promise.all([
      supabase.from("organizations").select("*").eq("id", quote.organization_id).single(),
      quote.client_id
        ? supabase.from("clients").select("*").eq("id", quote.client_id).single()
        : Promise.resolve({ data: null, error: null }),
      supabase
        .from("comments")
        .select("*")
        .eq("quote_id", quote.id)
        .order("created_at", { ascending: true }),
    ]);
  if (orgError) throw orgError;
  if (clientError) throw clientError;
  if (commentsError) throw commentsError;

  const blocks = await loadQuoteBlocks(supabase, quote.id);

  return {
    quote,
    organization: organization!,
    client: client ?? null,
    blocks,
    comments: comments ?? [],
  };
}
