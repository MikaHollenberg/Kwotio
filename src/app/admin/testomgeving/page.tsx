import { FlaskConical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createAdminClient } from "@/lib/supabase/admin";
import { TEST_ORGANIZATION_ID } from "@/lib/admin/testomgeving";
import { TestomgevingActions } from "./testomgeving-actions";

async function getTestomgevingCounts() {
  const admin = createAdminClient();
  const tables = ["quotes", "clients", "templates", "invoices"] as const;
  const counts = await Promise.all(
    tables.map((table) =>
      admin.from(table).select("id", { count: "exact", head: true }).eq("organization_id", TEST_ORGANIZATION_ID),
    ),
  );
  return {
    quotes: counts[0].count ?? 0,
    clients: counts[1].count ?? 0,
    templates: counts[2].count ?? 0,
    invoices: counts[3].count ?? 0,
  };
}

export default async function AdminTestomgevingPage() {
  const counts = await getTestomgevingCounts();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-ink-400">Hoofdaccount</p>
        <h2 className="font-display text-2xl font-semibold text-ink-500">Testomgeving</h2>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FlaskConical className="size-4 text-blue-600" />
            <CardTitle>Vrij testen, zonder echte organisaties te raken</CardTitle>
          </div>
          <CardDescription>
            Eén klik zet je met een echte sessie in de bestaande &ldquo;Test Account
            (rondleiding)&rdquo;-organisatie — een omgeving die exact hetzelfde werkt als een normaal
            account. Er is geen apart wachtwoord nodig; &ldquo;Terug naar hoofdaccount&rdquo; (zichtbaar
            bovenaan elke pagina zolang je er bent) brengt je weer terug in je eigen sessie.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Offertes", value: counts.quotes },
              { label: "Klanten", value: counts.clients },
              { label: "Templates", value: counts.templates },
              { label: "Facturen", value: counts.invoices },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-brand-sm bg-sand-100 px-3.5 py-3">
                <p className="text-xs font-medium text-ink-400">{label}</p>
                <p className="font-display text-xl font-semibold text-ink-500">{value}</p>
              </div>
            ))}
          </div>

          <TestomgevingActions />
        </CardContent>
      </Card>
    </div>
  );
}
