import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { REQUEST_STATUS_LABELS, REQUEST_STATUS_TONES } from "../status";
import { RequestDetailActions } from "./request-detail-actions";

export default async function AanvraagDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: request } = await supabase.from("quote_requests").select("*").eq("id", id).maybeSingle();
  if (!request) notFound();

  const { data: template } = request.template_id
    ? await supabase.from("templates").select("id, name").eq("id", request.template_id).maybeSingle()
    : { data: null };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/aanvragen"
          className="flex size-9 items-center justify-center rounded-brand-sm text-ink-400 hover:bg-sand-200"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <p className="text-sm text-ink-400">Offerte-aanvraag</p>
          <div className="flex items-center gap-3">
            <h2 className="font-display text-2xl font-semibold text-ink-500">{request.customer_name}</h2>
            <Badge tone={REQUEST_STATUS_TONES[request.status]}>{REQUEST_STATUS_LABELS[request.status]}</Badge>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gegevens</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-ink-400">Naam</dt>
            <dd className="font-medium text-ink-500">{request.customer_name}</dd>
          </div>
          <div>
            <dt className="text-ink-400">Bedrijfsnaam</dt>
            <dd className="font-medium text-ink-500">{request.customer_company || "—"}</dd>
          </div>
          <div>
            <dt className="text-ink-400">E-mail</dt>
            <dd className="font-medium text-ink-500">{request.customer_email || "—"}</dd>
          </div>
          <div>
            <dt className="text-ink-400">Telefoon</dt>
            <dd className="font-medium text-ink-500">{request.customer_phone || "—"}</dd>
          </div>
          <div>
            <dt className="text-ink-400">Template</dt>
            <dd className="font-medium text-ink-500">
              {template ? (
                <Link href={`/dashboard/templates/${template.id}`} className="text-teal-600 hover:text-teal-700">
                  {template.name}
                </Link>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-ink-400">Gewenste datum</dt>
            <dd className="font-medium text-ink-500">{request.desired_date ? formatDate(request.desired_date) : "—"}</dd>
          </div>
          <div>
            <dt className="text-ink-400">Aantal personen</dt>
            <dd className="font-medium text-ink-500">{request.guest_count ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-ink-400">Aangevraagd op</dt>
            <dd className="font-medium text-ink-500">{formatDate(request.created_at)}</dd>
          </div>
          {request.notes && (
            <div className="sm:col-span-2">
              <dt className="text-ink-400">Opmerkingen</dt>
              <dd className="whitespace-pre-wrap font-medium text-ink-500">{request.notes}</dd>
            </div>
          )}
        </CardContent>
      </Card>

      <RequestDetailActions
        requestId={request.id}
        customerName={request.customer_name}
        status={request.status}
        convertedQuoteId={request.converted_quote_id}
      />
    </div>
  );
}
