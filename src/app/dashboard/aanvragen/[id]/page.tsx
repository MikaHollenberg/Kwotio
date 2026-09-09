import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, Copy, Repeat } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import {
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_TONES,
  isStaleRequest,
  staleRequestDays,
  DUPLICATE_REQUEST_WINDOW_HOURS,
} from "../status";
import { RequestDetailActions } from "./request-detail-actions";

export default async function AanvraagDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: request } = await supabase.from("quote_requests").select("*").eq("id", id).maybeSingle();
  if (!request) notFound();

  const [{ data: template }, { data: sameEmailRequests }, { count: pastQuoteCount }, { count: acceptedQuoteCount }] =
    await Promise.all([
      request.template_id
        ? supabase.from("templates").select("id, name").eq("id", request.template_id).maybeSingle()
        : Promise.resolve({ data: null }),
      request.customer_email
        ? supabase
            .from("quote_requests")
            .select("id, created_at")
            .eq("customer_email", request.customer_email)
            .neq("id", request.id)
        : Promise.resolve({ data: null }),
      request.customer_email
        ? supabase
            .from("quotes")
            .select("id", { count: "exact", head: true })
            .eq("client_display_email", request.customer_email)
        : Promise.resolve({ count: 0 }),
      request.customer_email
        ? supabase
            .from("quotes")
            .select("id", { count: "exact", head: true })
            .eq("client_display_email", request.customer_email)
            .eq("status", "geaccepteerd")
        : Promise.resolve({ count: 0 }),
    ]);

  const duplicateMatch = (sameEmailRequests ?? []).find(
    (other) =>
      Math.abs(new Date(other.created_at).getTime() - new Date(request.created_at).getTime()) / 3_600_000 <=
      DUPLICATE_REQUEST_WINDOW_HOURS,
  );
  const priorRequestCount = sameEmailRequests?.length ?? 0;
  const isRecurringCustomer = priorRequestCount > 0 || (pastQuoteCount ?? 0) > 0;

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

      {isStaleRequest(request.status, request.created_at) && (
        <div className="flex items-center gap-2 rounded-brand-sm border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
          <AlertTriangle className="size-4 shrink-0" />
          Deze aanvraag staat al {staleRequestDays(request.created_at)} dagen niet opgepakt. Overweeg de klant zo snel mogelijk te benaderen.
        </div>
      )}

      {duplicateMatch && (
        <div className="flex items-center gap-2 rounded-brand-sm border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
          <Copy className="size-4 shrink-0" />
          <span className="flex-1">
            Dit e-mailadres heeft ook op {formatDate(duplicateMatch.created_at)} een aanvraag ingediend — mogelijk een
            dubbele indiening.
          </span>
          <Link href={`/dashboard/aanvragen/${duplicateMatch.id}`} className="shrink-0 font-medium underline">
            Bekijk die aanvraag →
          </Link>
        </div>
      )}

      {isRecurringCustomer && (
        <div className="flex items-center gap-2 rounded-brand-sm border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
          <Repeat className="size-4 shrink-0" />
          Terugkerende klant: dit is aanvraag nr. {priorRequestCount + 1} van dit e-mailadres
          {(pastQuoteCount ?? 0) > 0 && (
            <>
              , met {pastQuoteCount} eerdere offerte{pastQuoteCount === 1 ? "" : "s"}
              {(acceptedQuoteCount ?? 0) > 0 && ` (${acceptedQuoteCount} geaccepteerd)`}
            </>
          )}
          .
        </div>
      )}

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
        customerPhone={request.customer_phone}
        status={request.status}
        convertedQuoteId={request.converted_quote_id}
      />
    </div>
  );
}
