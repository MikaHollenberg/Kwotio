import { createClient } from "@/lib/supabase/server";
import { isInvoicingEnabled } from "@/lib/invoicing/feature-flag";
import { OffertesTable } from "./offertes-table";

export default async function OffertesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user!.id).single();

  const [{ data: quotes }, { data: clients }] = await Promise.all([
    supabase
      .from("quotes")
      .select(
        "id, title, status, total, currency, created_at, updated_at, event_date, client_id, price_per_person, aantal_personen, share_token, decline_reason",
      )
      .order("updated_at", { ascending: false }),
    supabase.from("clients").select("id, name"),
  ]);
  const clientNameById = new Map((clients ?? []).map((c) => [c.id, c.name]));

  const rows = (quotes ?? []).map((q) => ({
    ...q,
    clientName: (q.client_id && clientNameById.get(q.client_id)) ?? null,
  }));

  return <OffertesTable quotes={rows} invoicingEnabled={isInvoicingEnabled(profile?.organization_id)} />;
}
