import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/client";
import { reminderClientEmail, eventReminderClientEmail, expiringSoonAgencyEmail } from "@/lib/email/templates/notifications";
import { PRIVACYBELEID_URL } from "@/lib/legal";
import { renderEmailTemplate } from "@/lib/email/template-vars";
import { formatDate } from "@/lib/utils";

/**
 * Dagelijkse cron-taak (zie vercel.json): stuurt de door het bureau zelf
 * beheerde automatische klant-e-mails (`email_automation_rules`, Instellingen
 * → E-mailautomatisering — elke regel heeft een triggermoment + aantal
 * dagen + eigen onderwerp/inhoud, met klantnaam/offertetitel/
 * evenementdatum/link als placeholders, zie app/src/lib/email/
 * template-vars.ts), waarschuwt het bureau vlak voor het verlopen van een
 * offerte, en zet offertes voorbij hun geldigheidsdatum automatisch op
 * 'verlopen'.
 *
 * Beveiligd met CRON_SECRET — zonder correcte header/query-param weigert
 * deze route te draaien (voorkomt misbruik door derden).
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const provided =
    request.headers.get("authorization")?.replace("Bearer ", "") ?? request.nextUrl.searchParams.get("secret");
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date();
  const results = { remindersSent: 0, eventRemindersSent: 0, expiringSoonNotified: 0, markedExpired: 0 };

  const { data: organizations } = await supabase.from("organizations").select("id, brand_name, terms_url");
  const orgById = new Map((organizations ?? []).map((o) => [o.id, o]));
  const origin = `${request.nextUrl.protocol}//${request.nextUrl.host}`;

  // 1. Door het bureau zelf beheerde automatische e-mails (Instellingen → E-mailautomatisering)
  const { data: rules } = await supabase.from("email_automation_rules").select("*").eq("enabled", true);

  for (const rule of rules ?? []) {
    const org = orgById.get(rule.organization_id);
    if (!org) continue;

    if (rule.trigger_type === "days_after_sent_no_reaction") {
      const { data: openQuotes } = await supabase
        .from("quotes")
        .select("id, title, client_id, sent_at, share_token, event_date")
        .eq("organization_id", rule.organization_id)
        .in("status", ["verzonden", "bekeken"])
        .not("sent_at", "is", null);

      for (const quote of openQuotes ?? []) {
        if (!quote.sent_at) continue;
        const daysSinceSent = (now.getTime() - new Date(quote.sent_at).getTime()) / 86_400_000;
        if (daysSinceSent < rule.trigger_days) continue;

        const { count: alreadySent } = await supabase
          .from("activity_events")
          .select("id", { count: "exact", head: true })
          .eq("quote_id", quote.id)
          .eq("type", "reminder_sent")
          .contains("metadata", { ruleId: rule.id });
        if ((alreadySent ?? 0) > 0) continue;

        if (quote.client_id) {
          const { data: client } = await supabase
            .from("clients")
            .select("name, email")
            .eq("id", quote.client_id)
            .maybeSingle();
          if (client?.email) {
            const vars = {
              klantnaam: client.name,
              offertetitel: quote.title,
              evenementdatum: quote.event_date ? formatDate(quote.event_date) : "",
              link: `${origin}/offerte/${quote.share_token}`,
            };
            await sendEmail({
              to: client.email,
              subject: renderEmailTemplate(rule.subject, vars),
              html: reminderClientEmail({
                organizationName: org.brand_name,
                quoteTitle: quote.title,
                bodyText: renderEmailTemplate(rule.body, vars),
                shareUrl: vars.link,
                termsUrl: org.terms_url,
                privacyUrl: `${origin}${PRIVACYBELEID_URL}`,
              }),
            });
            results.remindersSent += 1;
          }
        }

        await supabase
          .from("activity_events")
          .insert({ quote_id: quote.id, type: "reminder_sent", metadata: { ruleId: rule.id } });
      }
    }

    if (rule.trigger_type === "days_before_event") {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + rule.trigger_days);
      const targetDateKey = targetDate.toISOString().slice(0, 10);

      const { data: upcomingEventQuotes } = await supabase
        .from("quotes")
        .select("id, title, client_id, share_token, event_date")
        .eq("organization_id", rule.organization_id)
        .eq("event_date", targetDateKey)
        .eq("status", "geaccepteerd");

      for (const quote of upcomingEventQuotes ?? []) {
        const { count: alreadySent } = await supabase
          .from("activity_events")
          .select("id", { count: "exact", head: true })
          .eq("quote_id", quote.id)
          .eq("type", "event_reminder_sent")
          .contains("metadata", { ruleId: rule.id });
        if ((alreadySent ?? 0) > 0) continue;

        if (quote.client_id) {
          const { data: client } = await supabase
            .from("clients")
            .select("name, email")
            .eq("id", quote.client_id)
            .maybeSingle();
          if (client?.email) {
            const vars = {
              klantnaam: client.name,
              offertetitel: quote.title,
              evenementdatum: formatDate(quote.event_date as string),
              link: `${origin}/offerte/${quote.share_token}`,
            };
            await sendEmail({
              to: client.email,
              subject: renderEmailTemplate(rule.subject, vars),
              html: eventReminderClientEmail({
                organizationName: org.brand_name,
                quoteTitle: quote.title,
                bodyText: renderEmailTemplate(rule.body, vars),
                shareUrl: vars.link,
                termsUrl: org.terms_url,
                privacyUrl: `${origin}${PRIVACYBELEID_URL}`,
              }),
            });
            results.eventRemindersSent += 1;
          }
        }

        await supabase
          .from("activity_events")
          .insert({ quote_id: quote.id, type: "event_reminder_sent", metadata: { ruleId: rule.id } });
      }
    }
  }

  // 2. Bureau waarschuwen vlak voordat een offerte verloopt (exact 2 dagen van tevoren)
  const in2Days = new Date(now);
  in2Days.setDate(in2Days.getDate() + 2);
  const in2DaysKey = in2Days.toISOString().slice(0, 10);

  const { data: expiringQuotes } = await supabase
    .from("quotes")
    .select("id, organization_id, title, client_id, total, currency, valid_until, created_by")
    .eq("valid_until", in2DaysKey)
    .not("status", "in", '("geaccepteerd","geweigerd","verlopen")');

  for (const quote of expiringQuotes ?? []) {
    const org = orgById.get(quote.organization_id);
    if (!org) continue;

    let notifyEmail: string | null = null;
    if (quote.created_by) {
      const { data: creator } = await supabase.from("profiles").select("email").eq("id", quote.created_by).maybeSingle();
      notifyEmail = creator?.email ?? null;
    }
    if (!notifyEmail) {
      const { data: owner } = await supabase
        .from("profiles")
        .select("email")
        .eq("organization_id", quote.organization_id)
        .eq("role", "owner")
        .limit(1)
        .maybeSingle();
      notifyEmail = owner?.email ?? null;
    }
    if (!notifyEmail) continue;

    const client = quote.client_id
      ? (await supabase.from("clients").select("name").eq("id", quote.client_id).maybeSingle()).data
      : null;

    await sendEmail({
      to: notifyEmail,
      subject: `"${quote.title}" verloopt over 2 dagen`,
      html: expiringSoonAgencyEmail({
        organizationName: org.brand_name,
        quoteTitle: quote.title,
        clientName: client?.name ?? "Onbekende klant",
        total: Number(quote.total),
        currency: quote.currency,
        validUntil: new Date(quote.valid_until as string).toLocaleDateString("nl-NL"),
        dashboardUrl: `${origin}/dashboard/offertes/${quote.id}`,
      }),
    });
    results.expiringSoonNotified += 1;
  }

  // 3. Offertes voorbij hun geldigheidsdatum automatisch markeren als 'verlopen'
  const todayKey = now.toISOString().slice(0, 10);
  const { data: expired, error: expireError } = await supabase
    .from("quotes")
    .update({ status: "verlopen" })
    .lt("valid_until", todayKey)
    .not("status", "in", '("geaccepteerd","geweigerd","verlopen")')
    .select("id");
  if (!expireError) results.markedExpired = expired?.length ?? 0;

  // 4. Oude rate-limit-hits opruimen (Fase 5 beveiligingsplan) — de vensters
  // zijn hooguit 15 minuten, dus alles ouder dan 2 dagen is sowieso irrelevant.
  const twoDaysAgo = new Date(now.getTime() - 2 * 86_400_000).toISOString();
  await supabase.from("rate_limit_hits").delete().lt("created_at", twoDaysAgo);

  return NextResponse.json({ ok: true, ...results });
}
