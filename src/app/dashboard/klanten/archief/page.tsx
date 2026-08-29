import { ArrowLeft, Archive } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ClientRowActions } from "../client-row-actions";
import { formatDate } from "@/lib/utils";

export default async function KlantenArchiefPage() {
  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, email, phone, company_name, archived_at")
    .not("archived_at", "is", null)
    .order("archived_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-ink-400">Klant-CRM</p>
          <h2 className="font-display text-2xl font-semibold text-ink-500">Gearchiveerde klanten</h2>
        </div>
        <ButtonLink href="/dashboard/klanten" variant="outline">
          <ArrowLeft className="size-4" /> Terug naar klanten
        </ButtonLink>
      </div>

      {!clients || clients.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <Archive className="size-8 text-ink-300" />
          <p className="text-sm text-ink-400">Geen gearchiveerde klanten.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs font-semibold uppercase tracking-wide text-ink-400">
                  <th className="px-5 py-3">Naam</th>
                  <th className="px-5 py-3">Bedrijf</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3 text-right">Gearchiveerd op</th>
                  <th className="px-5 py-3 text-right">Acties</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id} className="border-b border-ink-50 last:border-0 hover:bg-sand-100">
                    <td className="px-5 py-3 font-medium text-ink-500">{c.name}</td>
                    <td className="px-5 py-3 text-ink-400">{c.company_name || "—"}</td>
                    <td className="px-5 py-3 text-ink-400">{c.email || c.phone || "—"}</td>
                    <td className="px-5 py-3 text-right text-ink-400">
                      {c.archived_at ? formatDate(c.archived_at) : "—"}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <ClientRowActions clientId={c.id} name={c.name} archived />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
