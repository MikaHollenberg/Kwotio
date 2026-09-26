import { redirect } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RestoreQuoteButton } from "./restore-quote-button";
import { formatDate } from "@/lib/utils";
import { daysUntilPurge } from "@/lib/trash";

export default async function OffertesPrullenbakPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single();
  if (!profile) redirect("/login");

  // Zachtverwijderde rijen vallen buiten de gewone select-RLS-policy (zie
  // migratie 0082) -- deze pagina moet ze juist wél zien, dus via de
  // service-role-client met een expliciete org-filter, zelfde patroon als
  // de admin-queries elders in de app.
  const admin = createAdminClient();
  const { data: quotes } = await admin
    .from("quotes")
    .select("id, title, client_display_name, deleted_at")
    .eq("organization_id", profile.organization_id)
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-ink-400">Offertes</p>
          <h2 className="font-display text-2xl font-semibold text-ink-500">Prullenbak</h2>
        </div>
        <ButtonLink href="/dashboard/offertes" variant="outline">
          <ArrowLeft className="size-4" /> Terug naar offertes
        </ButtonLink>
      </div>

      {!quotes || quotes.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <Trash2 className="size-8 text-ink-300" />
          <p className="text-sm text-ink-400">De prullenbak is leeg.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs font-semibold uppercase tracking-wide text-ink-400">
                  <th className="px-5 py-3">Offerte</th>
                  <th className="px-5 py-3">Klant</th>
                  <th className="px-5 py-3">Verwijderd op</th>
                  <th className="px-5 py-3 text-right">Resterend</th>
                  <th className="px-5 py-3 text-right">Acties</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => {
                  const daysLeft = daysUntilPurge(q.deleted_at!);
                  return (
                    <tr key={q.id} className="kw-glow-row border-b border-ink-50 last:border-0">
                      <td className="px-5 py-3 font-medium text-ink-500">{q.title}</td>
                      <td className="px-5 py-3 text-ink-400">{q.client_display_name || "—"}</td>
                      <td className="px-5 py-3 text-ink-400">{formatDate(q.deleted_at!)}</td>
                      <td className="px-5 py-3 text-right">
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-600">
                          {daysLeft} {daysLeft === 1 ? "dag" : "dagen"} resterend
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <RestoreQuoteButton quoteId={q.id} title={q.title} />
                      </td>
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
