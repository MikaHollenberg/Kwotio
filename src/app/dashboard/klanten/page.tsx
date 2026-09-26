import { Plus, Archive, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ButtonLink } from "@/components/ui/button";
import { KlantenTable, type ClientRow } from "./klanten-table";

export default async function KlantenPage() {
  const supabase = await createClient();
  const [{ data: clients }, { data: quotes }] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name, email, phone, company_name, notes, created_at")
      .is("archived_at", null)
      .order("name", { ascending: true }),
    supabase.from("quotes").select("client_id, total, status"),
  ]);

  const statsByClient = new Map<string, { count: number; value: number }>();
  for (const q of quotes ?? []) {
    if (!q.client_id) continue;
    const entry = statsByClient.get(q.client_id) ?? { count: 0, value: 0 };
    entry.count += 1;
    if (q.status === "geaccepteerd") entry.value += Number(q.total);
    statsByClient.set(q.client_id, entry);
  }

  const rows: ClientRow[] = (clients ?? []).map((c) => {
    const stats = statsByClient.get(c.id) ?? { count: 0, value: 0 };
    return { ...c, quoteCount: stats.count, acceptedValue: stats.value };
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-ink-400">Klant-CRM</p>
          <h2 className="font-display text-2xl font-semibold text-ink-500">Klanten</h2>
        </div>
        <div className="flex items-center gap-2">
          <ButtonLink href="/dashboard/klanten/archief" variant="outline">
            <Archive className="size-4" /> Gearchiveerde klanten
          </ButtonLink>
          <ButtonLink href="/dashboard/klanten/prullenbak" variant="outline">
            <Trash2 className="size-4" /> Prullenbak
          </ButtonLink>
          <ButtonLink href="/dashboard/klanten/nieuw" data-faq-id="new-client-button">
            <Plus className="size-4" /> Nieuwe klant
          </ButtonLink>
        </div>
      </div>

      <KlantenTable clients={rows} />
    </div>
  );
}
