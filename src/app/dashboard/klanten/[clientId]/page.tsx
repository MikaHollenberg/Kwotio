import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClientDetail } from "./client-detail";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase.from("clients").select("*").eq("id", clientId).maybeSingle();
  if (!client) notFound();

  const { data: quotes } = await supabase
    .from("quotes")
    .select("id, title, status, total, currency, event_date, updated_at, share_token")
    .eq("client_id", clientId)
    .order("updated_at", { ascending: false });

  const quoteIds = (quotes ?? []).map((q) => q.id);
  const { data: signatures } =
    quoteIds.length > 0
      ? await supabase.from("signatures").select("quote_id, signed_at").in("quote_id", quoteIds)
      : { data: [] };

  return (
    <ClientDetail
      client={client}
      quotes={quotes ?? []}
      quoteIdsWithCertificate={(signatures ?? []).map((s) => s.quote_id)}
    />
  );
}
