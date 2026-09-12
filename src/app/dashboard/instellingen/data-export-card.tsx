import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExportCsvButton } from "@/components/dashboard/export-csv-button";
import { formatDate } from "@/lib/utils";

/**
 * Volledige data-export per entiteit (klanten/offertes/templates) — los van
 * de bestaande CSV-export op de offertes-lijst, die alleen de actief
 * gefilterde/zichtbare rijen exporteert. Deze kaart haalt altijd alle rijen
 * van de organisatie op, voor backup-/portabiliteitsdoeleinden.
 */
export async function DataExportCard({ organizationId }: { organizationId: string }) {
  const supabase = await createClient();

  const [{ data: clients }, { data: quotes }, { data: templates }] = await Promise.all([
    supabase
      .from("clients")
      .select("name, email, phone, company_name, notes, archived_at, created_at")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: true }),
    supabase
      .from("quotes")
      .select("title, status, total, currency, event_date, client_display_name, client_display_email, created_at, updated_at")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: true }),
    supabase
      .from("templates")
      .select("name, event_type, is_active, is_publicly_visible, archived_at, created_at")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: true }),
  ]);

  const clientRows = (clients ?? []).map((c) => ({
    Naam: c.name,
    "E-mail": c.email ?? "",
    Telefoon: c.phone ?? "",
    Bedrijfsnaam: c.company_name ?? "",
    Notities: c.notes ?? "",
    Gearchiveerd: c.archived_at ? "Ja" : "Nee",
    Aangemaakt: formatDate(c.created_at),
  }));

  const quoteRows = (quotes ?? []).map((q) => ({
    Titel: q.title,
    Status: q.status,
    Klant: q.client_display_name ?? "",
    "E-mail klant": q.client_display_email ?? "",
    Bedrag: q.total,
    Valuta: q.currency,
    Eventdatum: q.event_date ? formatDate(q.event_date) : "",
    Aangemaakt: formatDate(q.created_at),
    "Laatst gewijzigd": formatDate(q.updated_at),
  }));

  const templateRows = (templates ?? []).map((t) => ({
    Naam: t.name,
    "Type offerte": t.event_type,
    Actief: t.is_active ? "Ja" : "Nee",
    "Publiek zichtbaar": t.is_publicly_visible ? "Ja" : "Nee",
    Gearchiveerd: t.archived_at ? "Ja" : "Nee",
    Aangemaakt: formatDate(t.created_at),
  }));

  return (
    <Card data-faq-id="settings-data-exporteren">
      <CardHeader>
        <div>
          <CardTitle>Data exporteren</CardTitle>
          <CardDescription>
            Download al jullie klant-, offerte- en templategegevens als CSV — handig als backup of om ergens
            anders mee verder te werken.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <ExportCsvButton rows={clientRows} filename="klanten.csv" label={`Klanten (${clientRows.length})`} />
        <ExportCsvButton rows={quoteRows} filename="offertes.csv" label={`Offertes (${quoteRows.length})`} />
        <ExportCsvButton rows={templateRows} filename="templates.csv" label={`Templates (${templateRows.length})`} />
      </CardContent>
    </Card>
  );
}
