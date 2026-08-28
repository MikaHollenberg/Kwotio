import { Plus, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function KlantenPage() {
  const supabase = await createClient();
  const [{ data: clients }, { data: quotes }] = await Promise.all([
    supabase.from("clients").select("id, name, email, phone, created_at").order("name", { ascending: true }),
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-ink-400">Klant-CRM</p>
          <h2 className="font-display text-2xl font-semibold text-ink-500">Klanten</h2>
        </div>
        <ButtonLink href="/dashboard/klanten/nieuw">
          <Plus className="size-4" /> Nieuwe klant
        </ButtonLink>
      </div>

      {!clients || clients.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <Users className="size-8 text-ink-300" />
          <p className="text-sm text-ink-400">
            Nog geen klanten. Ze worden ook automatisch aangemaakt zodra je een offerte voor iemand nieuws maakt.
          </p>
          <ButtonLink href="/dashboard/klanten/nieuw" size="sm" className="mt-1">
            <Plus className="size-4" /> Eerste klant toevoegen
          </ButtonLink>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="flex flex-col divide-y divide-ink-50 sm:hidden">
            {clients.map((c) => {
              const stats = statsByClient.get(c.id) ?? { count: 0, value: 0 };
              return (
                <a key={c.id} href={`/dashboard/klanten/${c.id}`} className="flex flex-col gap-1 p-4 hover:bg-sand-100">
                  <span className="font-medium text-ink-500">{c.name}</span>
                  <span className="text-xs text-ink-400">{c.email || c.phone || "—"}</span>
                  <div className="flex items-center justify-between pt-1 text-xs text-ink-400">
                    <span>{stats.count} offertes · klant sinds {formatDate(c.created_at)}</span>
                    <span className="font-medium text-ink-500">
                      {stats.value > 0 ? formatCurrency(stats.value) : "—"}
                    </span>
                  </div>
                </a>
              );
            })}
          </div>

          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs font-semibold uppercase tracking-wide text-ink-400">
                  <th className="px-5 py-3">Naam</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3 text-right">Offertes</th>
                  <th className="px-5 py-3 text-right">Geaccepteerde waarde</th>
                  <th className="px-5 py-3 text-right">Klant sinds</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => {
                  const stats = statsByClient.get(c.id) ?? { count: 0, value: 0 };
                  return (
                    <tr key={c.id} className="border-b border-ink-50 last:border-0 hover:bg-sand-100">
                      <td className="px-5 py-3">
                        <a href={`/dashboard/klanten/${c.id}`} className="font-medium text-ink-500 hover:text-teal-700">
                          {c.name}
                        </a>
                      </td>
                      <td className="px-5 py-3 text-ink-400">{c.email || c.phone || "—"}</td>
                      <td className="px-5 py-3 text-right text-ink-500">{stats.count}</td>
                      <td className="px-5 py-3 text-right font-medium text-ink-500">
                        {stats.value > 0 ? formatCurrency(stats.value) : "—"}
                      </td>
                      <td className="px-5 py-3 text-right text-ink-400">{formatDate(c.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
