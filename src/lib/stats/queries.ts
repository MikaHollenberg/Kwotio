import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, QuoteStatus, ActivityEventType } from "@/lib/types/database";
import { calculateActualQuoteValue } from "@/lib/blocks/pricing";

type Client = SupabaseClient<Database>;

const OPEN_STATUSES: QuoteStatus[] = ["verzonden", "bekeken", "in_overleg"];

// ---------------------------------------------------------------------------
// Dashboard-KPI's
// ---------------------------------------------------------------------------

export type DashboardKpis = {
  quotesThisMonth: number;
  conversionRate: number | null;
  avgDaysToAccept: number | null;
  avgQuoteValue: number;
  pipelineValue: number;
  topTemplates: { templateId: string; name: string; sentCount: number; acceptedCount: number; rate: number }[];
};

export async function getDashboardKpis(supabase: Client, organizationId: string): Promise<DashboardKpis> {
  const { data } = await supabase
    .from("quotes")
    .select("id, status, total, sent_at, created_at, template_id, price_per_person, aantal_personen")
    .eq("organization_id", organizationId);
  const rows = data ?? [];
  const actualValue = (q: (typeof rows)[number]) =>
    calculateActualQuoteValue({ total: Number(q.total), pricePerPerson: q.price_per_person, aantalPersonen: q.aantal_personen });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const quotesThisMonth = rows.filter((q) => new Date(q.created_at) >= startOfMonth).length;

  const sentRows = rows.filter((q) => q.sent_at);
  const acceptedRows = rows.filter((q) => q.status === "geaccepteerd");
  const conversionRate = sentRows.length > 0 ? acceptedRows.length / sentRows.length : null;

  const avgQuoteValue = rows.length > 0 ? rows.reduce((sum, q) => sum + actualValue(q), 0) / rows.length : 0;

  const pipelineValue = rows
    .filter((q) => OPEN_STATUSES.includes(q.status))
    .reduce((sum, q) => sum + actualValue(q), 0);

  let avgDaysToAccept: number | null = null;
  if (acceptedRows.length > 0) {
    const { data: signatures } = await supabase
      .from("signatures")
      .select("quote_id, signed_at")
      .in("quote_id", acceptedRows.map((q) => q.id));
    const sentAtByQuoteId = new Map(rows.map((q) => [q.id, q.sent_at]));
    const days: number[] = [];
    for (const sig of signatures ?? []) {
      const sentAt = sentAtByQuoteId.get(sig.quote_id);
      if (!sentAt) continue;
      const delta = (new Date(sig.signed_at).getTime() - new Date(sentAt).getTime()) / 86_400_000;
      if (delta >= 0) days.push(delta);
    }
    avgDaysToAccept = days.length > 0 ? days.reduce((a, b) => a + b, 0) / days.length : null;
  }

  const templateIds = [...new Set(rows.map((q) => q.template_id).filter((id): id is string => !!id))];
  let topTemplates: DashboardKpis["topTemplates"] = [];
  if (templateIds.length > 0) {
    const { data: templates } = await supabase.from("templates").select("id, name").in("id", templateIds);
    const nameById = new Map((templates ?? []).map((t) => [t.id, t.name]));
    const byTemplate = new Map<string, { sent: number; accepted: number }>();
    for (const q of rows) {
      if (!q.template_id) continue;
      const entry = byTemplate.get(q.template_id) ?? { sent: 0, accepted: 0 };
      if (q.sent_at) entry.sent += 1;
      if (q.status === "geaccepteerd") entry.accepted += 1;
      byTemplate.set(q.template_id, entry);
    }
    topTemplates = [...byTemplate.entries()]
      .map(([templateId, { sent, accepted }]) => ({
        templateId,
        name: nameById.get(templateId) ?? "Onbekend template",
        sentCount: sent,
        acceptedCount: accepted,
        rate: sent > 0 ? accepted / sent : 0,
      }))
      .filter((t) => t.sentCount > 0)
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 5);
  }

  return { quotesThisMonth, conversionRate, avgDaysToAccept, avgQuoteValue, pipelineValue, topTemplates };
}

// ---------------------------------------------------------------------------
// Template-prestaties (statistiekenpagina) — populariteit + conversie per
// template. Alleen offertes die vanuit een template gestart zijn tellen mee
// (template_id niet null) — losse/custom offertes horen hier bewust niet bij.
// ---------------------------------------------------------------------------

export type TemplatePerformance = {
  templateId: string;
  name: string;
  requestedCount: number;
  acceptedCount: number;
  conversionRate: number;
};

export async function getTemplatePerformance(supabase: Client, organizationId: string): Promise<TemplatePerformance[]> {
  const { data } = await supabase
    .from("quotes")
    .select("status, template_id")
    .eq("organization_id", organizationId)
    .not("template_id", "is", null);
  const rows = data ?? [];
  if (rows.length === 0) return [];

  const templateIds = [...new Set(rows.map((q) => q.template_id).filter((id): id is string => !!id))];
  const { data: templates } = await supabase.from("templates").select("id, name").in("id", templateIds);
  const nameById = new Map((templates ?? []).map((t) => [t.id, t.name]));

  const byTemplate = new Map<string, { requested: number; accepted: number }>();
  for (const q of rows) {
    if (!q.template_id) continue;
    const entry = byTemplate.get(q.template_id) ?? { requested: 0, accepted: 0 };
    entry.requested += 1;
    if (q.status === "geaccepteerd") entry.accepted += 1;
    byTemplate.set(q.template_id, entry);
  }

  return [...byTemplate.entries()]
    .map(([templateId, { requested, accepted }]) => ({
      templateId,
      name: nameById.get(templateId) ?? "Onbekend template",
      requestedCount: requested,
      acceptedCount: accepted,
      conversionRate: requested > 0 ? accepted / requested : 0,
    }))
    .sort((a, b) => b.conversionRate - a.conversionRate);
}

// ---------------------------------------------------------------------------
// Recente activiteit (dashboard-overzicht)
// ---------------------------------------------------------------------------

export type RecentActivityItem = {
  id: string;
  type: ActivityEventType;
  quoteId: string;
  quoteTitle: string;
  createdAt: string;
};

export async function getRecentActivity(
  supabase: Client,
  organizationId: string,
  limit = 8,
): Promise<RecentActivityItem[]> {
  const { data: quotes } = await supabase.from("quotes").select("id, title").eq("organization_id", organizationId);
  const quoteIds = (quotes ?? []).map((q) => q.id);
  if (quoteIds.length === 0) return [];
  const titleById = new Map((quotes ?? []).map((q) => [q.id, q.title]));

  const { data: events } = await supabase
    .from("activity_events")
    .select("id, type, quote_id, created_at")
    .in("quote_id", quoteIds)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (events ?? []).map((e) => ({
    id: e.id,
    type: e.type,
    quoteId: e.quote_id,
    quoteTitle: titleById.get(e.quote_id) ?? "Offerte",
    createdAt: e.created_at,
  }));
}

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

export type PipelineQuote = {
  id: string;
  title: string;
  clientName: string | null;
  total: number;
  currency: string;
  updatedAt: string;
};

export async function getPipeline(
  supabase: Client,
  organizationId: string,
): Promise<Record<QuoteStatus, PipelineQuote[]>> {
  const [{ data: quotes }, { data: clients }] = await Promise.all([
    supabase
      .from("quotes")
      .select("id, title, status, total, currency, updated_at, client_id, price_per_person, aantal_personen")
      .eq("organization_id", organizationId)
      .order("updated_at", { ascending: false }),
    supabase.from("clients").select("id, name").eq("organization_id", organizationId),
  ]);
  const nameById = new Map((clients ?? []).map((c) => [c.id, c.name]));

  const grouped: Record<QuoteStatus, PipelineQuote[]> = {
    concept: [],
    verzonden: [],
    bekeken: [],
    in_overleg: [],
    geaccepteerd: [],
    verlopen: [],
    geweigerd: [],
  };

  for (const q of quotes ?? []) {
    grouped[q.status].push({
      id: q.id,
      title: q.title,
      clientName: q.client_id ? (nameById.get(q.client_id) ?? null) : null,
      total: calculateActualQuoteValue({ total: Number(q.total), pricePerPerson: q.price_per_person, aantalPersonen: q.aantal_personen }),
      currency: q.currency,
      updatedAt: q.updated_at,
    });
  }

  return grouped;
}

// ---------------------------------------------------------------------------
// Maandreeks sinds de eerste offerte — basis voor periode-vergelijking
// (aantal offertes en offertewaarde per maand, gegroepeerd door de client
// tot maanden/jaren zodat de gebruiker zelf periodes kan kiezen om te
// vergelijken)
// ---------------------------------------------------------------------------

export type MonthlySeriesPoint = { monthKey: string; label: string; count: number; total: number };

export async function getMonthlySeries(supabase: Client, organizationId: string): Promise<MonthlySeriesPoint[]> {
  const { data } = await supabase
    .from("quotes")
    .select("created_at, total, price_per_person, aantal_personen")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });
  const rows = data ?? [];
  if (rows.length === 0) return [];

  const earliest = new Date(rows[0].created_at);
  const now = new Date();
  const points: MonthlySeriesPoint[] = [];

  for (
    let d = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
    d <= now;
    d = new Date(d.getFullYear(), d.getMonth() + 1, 1)
  ) {
    const monthStart = d;
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const inMonth = rows.filter((q) => {
      const created = new Date(q.created_at);
      return created >= monthStart && created < monthEnd;
    });
    points.push({
      monthKey: `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, "0")}`,
      label: monthStart.toLocaleDateString("nl-NL", { month: "short", year: "numeric" }),
      count: inMonth.length,
      total: inMonth.reduce(
        (sum, q) =>
          sum + calculateActualQuoteValue({ total: Number(q.total), pricePerPerson: q.price_per_person, aantalPersonen: q.aantal_personen }),
        0,
      ),
    });
  }
  return points;
}

// ---------------------------------------------------------------------------
// Kalenderweergave — geaccepteerde offertes met een eventdatum
// ---------------------------------------------------------------------------

export type CalendarEvent = {
  quoteId: string;
  title: string;
  clientName: string | null;
  eventDate: string;
};

export async function getUpcomingEvents(supabase: Client, organizationId: string): Promise<CalendarEvent[]> {
  const [{ data: quotes }, { data: clients }] = await Promise.all([
    supabase
      .from("quotes")
      .select("id, title, event_date, client_id")
      .eq("organization_id", organizationId)
      .eq("status", "geaccepteerd")
      .not("event_date", "is", null)
      .order("event_date", { ascending: true }),
    supabase.from("clients").select("id, name").eq("organization_id", organizationId),
  ]);
  const nameById = new Map((clients ?? []).map((c) => [c.id, c.name]));

  return (quotes ?? [])
    .filter((q) => q.event_date)
    .map((q) => ({
      quoteId: q.id,
      title: q.title,
      clientName: q.client_id ? (nameById.get(q.client_id) ?? null) : null,
      eventDate: q.event_date as string,
    }));
}

// ---------------------------------------------------------------------------
// Engagement-analytics per offerte
// ---------------------------------------------------------------------------

export type QuoteEngagement = {
  totalViews: number;
  firstViewedAt: string | null;
  lastViewedAt: string | null;
  sectionViewCounts: Record<string, number>;
  optionChanges: number;
  commentCount: number;
};

export async function getQuoteEngagement(supabase: Client, quoteId: string): Promise<QuoteEngagement> {
  const { data } = await supabase
    .from("activity_events")
    .select("type, metadata, created_at")
    .eq("quote_id", quoteId)
    .order("created_at", { ascending: true });
  const rows = data ?? [];

  const views = rows.filter((e) => e.type === "viewed");
  const sectionViewCounts: Record<string, number> = {};
  for (const e of rows) {
    if (e.type !== "section_viewed") continue;
    const blockId = (e.metadata as Record<string, unknown>)?.blockId;
    if (typeof blockId === "string") sectionViewCounts[blockId] = (sectionViewCounts[blockId] ?? 0) + 1;
  }

  return {
    totalViews: views.length,
    firstViewedAt: views[0]?.created_at ?? null,
    lastViewedAt: views[views.length - 1]?.created_at ?? null,
    sectionViewCounts,
    optionChanges: rows.filter((e) => e.type === "option_changed").length,
    commentCount: rows.filter((e) => e.type === "comment_added").length,
  };
}
