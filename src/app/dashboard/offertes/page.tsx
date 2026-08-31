import { createClient } from "@/lib/supabase/server";
import { OffertesTable } from "./offertes-table";

export default async function OffertesPage() {
  const supabase = await createClient();
  const [{ data: quotes }, { data: clients }] = await Promise.all([
    supabase
      .from("quotes")
      .select(
        "id, title, status, total, currency, created_at, updated_at, event_date, client_id, price_per_person, aantal_personen, share_token",
      )
      .order("updated_at", { ascending: false }),
    supabase.from("clients").select("id, name"),
  ]);
  const clientNameById = new Map((clients ?? []).map((c) => [c.id, c.name]));

  const rows = (quotes ?? []).map((q) => ({
    ...q,
    clientName: (q.client_id && clientNameById.get(q.client_id)) ?? null,
  }));

  return <OffertesTable quotes={rows} />;
}
