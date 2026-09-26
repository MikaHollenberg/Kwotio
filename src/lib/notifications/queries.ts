import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

type Client = SupabaseClient<Database>;

export type NotificationItem = {
  id: string;
  type: "comment" | "declined" | "signed" | "quote_request" | "lead" | "follow_up_reminder";
  title: string;
  detail: string;
  href: string;
  createdAt: string;
};

/**
 * Haalt de meest recente, agency-relevante gebeurtenissen op voor de
 * meldingenbel -- geen aparte notifications-tabel, want alles staat al
 * ergens: klantreacties (comments), afwijzingen/ondertekeningen
 * (activity_events) en nieuwe offerte-aanvragen (quote_requests). Net als
 * getPipeline() eerst de offerte-id's/-titels van de organisatie ophalen en
 * daarna de kindtabellen filteren op die id's, i.p.v. een embedded-join --
 * comments/activity_events hebben zelf geen organization_id-kolom.
 */
export async function getRecentNotifications(
  supabase: Client,
  organizationId: string,
  limit = 20,
): Promise<NotificationItem[]> {
  const { data: quotes } = await supabase
    .from("quotes")
    .select("id, title, reminder_date")
    .eq("organization_id", organizationId);
  const quoteIds = (quotes ?? []).map((q) => q.id);
  const titleById = new Map((quotes ?? []).map((q) => [q.id, q.title]));
  const todayKey = new Date().toISOString().slice(0, 10);

  const [{ data: comments }, { data: events }, { data: requests }, { data: leads }, { data: leadReminders }] = await Promise.all([
    quoteIds.length > 0
      ? supabase
          .from("comments")
          .select("id, quote_id, author_name, body, created_at")
          .eq("author_type", "client")
          .in("quote_id", quoteIds)
          .order("created_at", { ascending: false })
          .limit(limit)
      : Promise.resolve({ data: [] as { id: string; quote_id: string; author_name: string; body: string; created_at: string }[] }),
    quoteIds.length > 0
      ? supabase
          .from("activity_events")
          .select("id, quote_id, type, metadata, created_at")
          .in("quote_id", quoteIds)
          .in("type", ["declined", "signed"])
          .order("created_at", { ascending: false })
          .limit(limit)
      : Promise.resolve({
          data: [] as { id: string; quote_id: string; type: string; metadata: Record<string, unknown>; created_at: string }[],
        }),
    supabase
      .from("quote_requests")
      .select("id, customer_name, created_at")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("leads")
      .select("id, name, created_at")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("leads")
      .select("id, name, reminder_date")
      .eq("organization_id", organizationId)
      .not("reminder_date", "is", null)
      .lte("reminder_date", todayKey),
  ]);

  const items: NotificationItem[] = [];

  for (const c of comments ?? []) {
    items.push({
      id: `comment-${c.id}`,
      type: "comment",
      title: "Nieuwe reactie",
      detail: `"${titleById.get(c.quote_id) ?? "een offerte"}" — ${c.author_name}: ${c.body}`,
      href: `/dashboard/offertes/${c.quote_id}`,
      createdAt: c.created_at,
    });
  }

  for (const e of events ?? []) {
    const title = titleById.get(e.quote_id) ?? "een offerte";
    if (e.type === "declined") {
      const reason = (e.metadata as { reason?: string } | null)?.reason;
      items.push({
        id: `event-${e.id}`,
        type: "declined",
        title: "Offerte afgewezen",
        detail: reason ? `"${title}" — reden: ${reason}` : `"${title}"`,
        href: `/dashboard/offertes/${e.quote_id}`,
        createdAt: e.created_at,
      });
    } else if (e.type === "signed") {
      items.push({
        id: `event-${e.id}`,
        type: "signed",
        title: "Offerte ondertekend",
        detail: `"${title}" is ondertekend`,
        href: `/dashboard/offertes/${e.quote_id}`,
        createdAt: e.created_at,
      });
    }
  }

  for (const r of requests ?? []) {
    items.push({
      id: `request-${r.id}`,
      type: "quote_request",
      title: "Nieuwe offerte-aanvraag",
      detail: r.customer_name,
      href: `/dashboard/aanvragen/${r.id}`,
      createdAt: r.created_at,
    });
  }

  for (const l of leads ?? []) {
    items.push({
      id: `lead-${l.id}`,
      type: "lead",
      title: "Nieuwe lead",
      detail: l.name,
      href: `/dashboard/leads`,
      createdAt: l.created_at,
    });
  }

  // Follow-up-herinneringen: zelf gezette datums die vandaag of eerder zijn
  // -- createdAt wordt hier de herinneringsdatum zelf, zodat de melding pas
  // als "nieuw" (ongelezen) telt zodra die datum daadwerkelijk is aangebroken.
  for (const l of leadReminders ?? []) {
    items.push({
      id: `reminder-lead-${l.id}`,
      type: "follow_up_reminder",
      title: "Follow-up: lead",
      detail: l.name,
      href: `/dashboard/leads`,
      createdAt: `${l.reminder_date}T00:00:00.000Z`,
    });
  }
  for (const q of quotes ?? []) {
    if (!q.reminder_date || q.reminder_date > todayKey) continue;
    items.push({
      id: `reminder-quote-${q.id}`,
      type: "follow_up_reminder",
      title: "Follow-up: offerte",
      detail: `"${q.title}"`,
      href: `/dashboard/offertes/${q.id}`,
      createdAt: `${q.reminder_date}T00:00:00.000Z`,
    });
  }

  items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return items.slice(0, limit);
}
