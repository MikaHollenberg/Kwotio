import { Plus, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QuoteStatusBadge, STATUS_LABELS } from "@/components/ui/badge";
import { ExportCsvButton } from "@/components/dashboard/export-csv-button";
import { OfferteRowActions } from "./offerte-row-actions";
import { OfferteEditLink } from "./offerte-edit-link";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { calculateActualQuoteValue } from "@/lib/blocks/pricing";

function QuoteValueCell({
  total,
  currency,
  pricePerPerson,
  aantalPersonen,
  align = "left",
}: {
  total: number;
  currency: string;
  pricePerPerson: boolean;
  aantalPersonen: number | null;
  align?: "left" | "right";
}) {
  const knowsHeadcount = pricePerPerson && aantalPersonen != null;

  if (!knowsHeadcount) {
    return (
      <span className="font-medium text-ink-500">
        {formatCurrency(total, currency)}
        {pricePerPerson ? " p.p." : ""}
      </span>
    );
  }

  const actualValue = calculateActualQuoteValue({ total, pricePerPerson, aantalPersonen });
  return (
    <div className={cn("flex flex-col", align === "right" && "items-end")}>
      <span className="font-medium text-ink-500">{formatCurrency(actualValue, currency)}</span>
      <span className="text-xs text-ink-400">{formatCurrency(total, currency)} p.p.</span>
    </div>
  );
}

export default async function OffertesPage() {
  const supabase = await createClient();
  const [{ data: quotes }, { data: clients }] = await Promise.all([
    supabase
      .from("quotes")
      .select("id, title, status, total, currency, updated_at, event_date, client_id, price_per_person, aantal_personen")
      .order("updated_at", { ascending: false }),
    supabase.from("clients").select("id, name"),
  ]);
  const clientNameById = new Map((clients ?? []).map((c) => [c.id, c.name]));

  const exportRows = (quotes ?? []).map((q) => ({
    Titel: q.title,
    Klant: (q.client_id && clientNameById.get(q.client_id)) ?? "",
    Status: STATUS_LABELS[q.status],
    Eventdatum: q.event_date ? formatDate(q.event_date) : "",
    Bedrag: calculateActualQuoteValue({
      total: Number(q.total),
      pricePerPerson: q.price_per_person,
      aantalPersonen: q.aantal_personen,
    }),
    "Prijs p.p.": q.price_per_person ? Number(q.total) : "",
    Valuta: q.currency,
    "Laatst gewijzigd": formatDate(q.updated_at),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-ink-400">Alle offertes</p>
          <h2 className="font-display text-2xl font-semibold text-ink-500">Offertes</h2>
        </div>
        <div className="flex items-center gap-2">
          <ExportCsvButton rows={exportRows} filename="offertes.csv" />
          <ButtonLink href="/dashboard/offertes/nieuw">
            <Plus className="size-4" /> Nieuwe offerte
          </ButtonLink>
        </div>
      </div>

      {!quotes || quotes.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <FileText className="size-8 text-ink-300" />
          <p className="text-sm text-ink-400">
            Nog geen offertes. Maak je eerste offerte aan vanuit een template of vanaf nul.
          </p>
          <ButtonLink href="/dashboard/offertes/nieuw" size="sm" className="mt-1">
            <Plus className="size-4" /> Eerste offerte maken
          </ButtonLink>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="flex flex-col divide-y divide-ink-50 sm:hidden">
            {quotes.map((q) => (
              <div key={q.id} className="flex flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <OfferteEditLink
                    quoteId={q.id}
                    status={q.status}
                    className="font-medium text-ink-500 hover:text-teal-700"
                  >
                    {q.title}
                  </OfferteEditLink>
                  <QuoteStatusBadge status={q.status} />
                </div>
                <div className="flex items-center justify-between text-xs text-ink-400">
                  <span>{(q.client_id && clientNameById.get(q.client_id)) ?? "—"}</span>
                  <span>{q.event_date ? formatDate(q.event_date) : "—"}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <QuoteValueCell
                      total={Number(q.total)}
                      currency={q.currency}
                      pricePerPerson={q.price_per_person}
                      aantalPersonen={q.aantal_personen}
                    />
                    <span className="text-xs text-ink-400">Gewijzigd {formatDate(q.updated_at)}</span>
                  </div>
                  <OfferteRowActions quoteId={q.id} title={q.title} status={q.status} />
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs font-semibold uppercase tracking-wide text-ink-400">
                  <th className="px-5 py-3">Offerte</th>
                  <th className="px-5 py-3">Klant</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Eventdatum</th>
                  <th className="px-5 py-3 text-right">Waarde</th>
                  <th className="px-5 py-3 text-right">Laatst gewijzigd</th>
                  <th className="px-5 py-3 text-right">Acties</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => (
                  <tr
                    key={q.id}
                    className="border-b border-ink-50 last:border-0 hover:bg-sand-100"
                  >
                    <td className="px-5 py-3">
                      <OfferteEditLink
                        quoteId={q.id}
                        status={q.status}
                        className="font-medium text-ink-500 hover:text-teal-700"
                      >
                        {q.title}
                      </OfferteEditLink>
                    </td>
                    <td className="px-5 py-3 text-ink-400">
                      {(q.client_id && clientNameById.get(q.client_id)) ?? "—"}
                    </td>
                    <td className="px-5 py-3">
                      <QuoteStatusBadge status={q.status} />
                    </td>
                    <td className="px-5 py-3 text-ink-400">
                      {q.event_date ? formatDate(q.event_date) : "—"}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <QuoteValueCell
                        total={Number(q.total)}
                        currency={q.currency}
                        pricePerPerson={q.price_per_person}
                        aantalPersonen={q.aantal_personen}
                        align="right"
                      />
                    </td>
                    <td className="px-5 py-3 text-right text-ink-400">{formatDate(q.updated_at)}</td>
                    <td className="px-5 py-3 text-right">
                      <OfferteRowActions quoteId={q.id} title={q.title} status={q.status} />
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
