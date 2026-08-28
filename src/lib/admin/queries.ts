import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { OrgStatus, UserRole, LogoPreference } from "@/lib/types/database";

// Alle queries hier lopen via de service-role client (bypass RLS), gegund
// omdat elke aanroeper al hard server-side gecheckt is via requireSuperAdmin()
// (src/lib/admin/auth.ts) — zelfde architectuurprincipe als de bestaande
// share-token-flow in dit project: service-role + expliciete applicatie-check,
// niet op RLS leunen voor brede/kruis-organisatie leesqueries.

export type OrganizationListRow = {
  id: string;
  name: string;
  brandName: string;
  status: OrgStatus;
  plan: string | null;
  monthlyPrice: number;
  memberCount: number;
  createdAt: string;
  archivedAt: string | null;
};

export async function getOrganizationsList(options?: { archived?: boolean }): Promise<OrganizationListRow[]> {
  const showArchived = options?.archived ?? false;
  const admin = createAdminClient();
  const [{ data: orgs }, { data: profiles }] = await Promise.all([
    admin
      .from("organizations")
      .select("id, name, brand_name, status, plan, monthly_price, created_at, archived_at")
      .order("created_at", { ascending: false }),
    admin.from("profiles").select("organization_id"),
  ]);

  const countByOrg = new Map<string, number>();
  for (const p of profiles ?? []) {
    countByOrg.set(p.organization_id, (countByOrg.get(p.organization_id) ?? 0) + 1);
  }

  return (orgs ?? [])
    .filter((o) => o.name !== "Platform")
    .filter((o) => (showArchived ? o.archived_at !== null : o.archived_at === null))
    .map((o) => ({
      id: o.id,
      name: o.name,
      brandName: o.brand_name,
      status: o.status,
      plan: o.plan,
      monthlyPrice: Number(o.monthly_price),
      memberCount: countByOrg.get(o.id) ?? 0,
      createdAt: o.created_at,
      archivedAt: o.archived_at,
    }));
}

export type OrganizationDetail = OrganizationListRow & {
  domain: string | null;
  kvkNumber: string | null;
  btwNumber: string | null;
  iban: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: { street?: string; postalCode?: string; city?: string; country?: string } | null;
  logoHorizontalUrl: string | null;
  logoSquareUrl: string | null;
  logoPreference: LogoPreference;
  brandTheme: Record<string, unknown>;
};

export async function getOrganizationDetail(organizationId: string): Promise<OrganizationDetail | null> {
  const admin = createAdminClient();
  const { data: org } = await admin.from("organizations").select("*").eq("id", organizationId).single();
  if (!org) return null;

  const { count } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  return {
    id: org.id,
    name: org.name,
    brandName: org.brand_name,
    status: org.status,
    plan: org.plan,
    monthlyPrice: Number(org.monthly_price),
    memberCount: count ?? 0,
    createdAt: org.created_at,
    archivedAt: org.archived_at,
    domain: org.domain,
    kvkNumber: org.kvk_number,
    btwNumber: org.btw_number,
    iban: org.iban,
    contactEmail: org.contact_email,
    contactPhone: org.contact_phone,
    address: (org.address as OrganizationDetail["address"]) ?? null,
    logoHorizontalUrl: org.logo_horizontal_url,
    logoSquareUrl: org.logo_square_url,
    logoPreference: org.logo_preference,
    brandTheme: org.brand_theme,
  };
}

export type OrganizationMember = {
  id: string;
  fullName: string | null;
  email: string;
  role: UserRole;
};

export async function getOrganizationMembers(organizationId: string): Promise<OrganizationMember[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });

  return (data ?? []).map((p) => ({ id: p.id, fullName: p.full_name, email: p.email, role: p.role }));
}

export type PlatformStats = {
  organizationsTotal: number;
  organizationsByStatus: Record<OrgStatus, number>;
  usersTotal: number;
  quotesTotal: number;
  quotesLast30Days: number;
  mrr: number;
  estimatedRevenueToDate: number;
  organizationsPerMonth: { month: string; count: number }[];
  quotesPerMonth: { month: string; count: number }[];
  revenuePerMonth: { month: string; total: number }[];
  topOrganizations: { id: string; name: string; quoteCount: number; revenue: number }[];
};

export async function getPlatformStats(): Promise<PlatformStats> {
  const admin = createAdminClient();
  const [{ data: orgs }, { data: profiles }, { data: quotes }] = await Promise.all([
    admin
      .from("organizations")
      .select("id, name, status, monthly_price, created_at")
      .neq("name", "Platform")
      .is("archived_at", null),
    admin.from("profiles").select("id"),
    admin.from("quotes").select("id, organization_id, total, status, created_at"),
  ]);

  const orgRows = orgs ?? [];
  const quoteRows = quotes ?? [];

  const organizationsByStatus: Record<OrgStatus, number> = { proefperiode: 0, actief: 0, opgezegd: 0 };
  for (const o of orgRows) organizationsByStatus[o.status] += 1;

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86_400_000);
  const quotesLast30Days = quoteRows.filter((q) => new Date(q.created_at) >= thirtyDaysAgo).length;

  const mrr = orgRows.filter((o) => o.status === "actief").reduce((sum, o) => sum + Number(o.monthly_price), 0);
  const estimatedRevenueToDate = orgRows.reduce((sum, o) => {
    const months = Math.max(
      1,
      (now.getFullYear() - new Date(o.created_at).getFullYear()) * 12 +
        (now.getMonth() - new Date(o.created_at).getMonth()) +
        1,
    );
    return sum + Number(o.monthly_price) * months;
  }, 0);

  const monthLabels: { key: string; label: string; start: Date; end: Date }[] = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    monthLabels.push({
      key: `${start.getFullYear()}-${start.getMonth()}`,
      label: start.toLocaleDateString("nl-NL", { month: "short" }),
      start,
      end,
    });
  }

  const organizationsPerMonth = monthLabels.map(({ label, start, end }) => ({
    month: label,
    count: orgRows.filter((o) => {
      const c = new Date(o.created_at);
      return c >= start && c < end;
    }).length,
  }));

  const quotesPerMonth = monthLabels.map(({ label, start, end }) => ({
    month: label,
    count: quoteRows.filter((q) => {
      const c = new Date(q.created_at);
      return c >= start && c < end;
    }).length,
  }));

  // Geschatte MRR-opbouw per maand — som van maandbedragen van organisaties die
  // al bestonden vóór die maand. Er wordt geen historie van status-wijzigingen
  // bijgehouden, dus dit negeert opzeggingen in het verleden (net als de
  // "geschatte omzet tot nu toe" hierboven) — een benadering, geen boekhouding.
  const revenuePerMonth = monthLabels.map(({ label, end }) => ({
    month: label,
    total: orgRows
      .filter((o) => new Date(o.created_at) < end)
      .reduce((sum, o) => sum + Number(o.monthly_price), 0),
  }));

  const nameById = new Map(orgRows.map((o) => [o.id, o.name]));
  const byOrg = new Map<string, { quoteCount: number; revenue: number }>();
  for (const q of quoteRows) {
    if (!nameById.has(q.organization_id)) continue; // gearchiveerd of Platform
    const entry = byOrg.get(q.organization_id) ?? { quoteCount: 0, revenue: 0 };
    entry.quoteCount += 1;
    if (q.status === "geaccepteerd") entry.revenue += Number(q.total);
    byOrg.set(q.organization_id, entry);
  }
  const topOrganizations = [...byOrg.entries()]
    .map(([id, v]) => ({ id, name: nameById.get(id)!, ...v }))
    .sort((a, b) => b.quoteCount - a.quoteCount)
    .slice(0, 5);

  return {
    organizationsTotal: orgRows.length,
    organizationsByStatus,
    usersTotal: (profiles ?? []).length,
    quotesTotal: quoteRows.length,
    quotesLast30Days,
    mrr,
    estimatedRevenueToDate,
    organizationsPerMonth,
    quotesPerMonth,
    revenuePerMonth,
    topOrganizations,
  };
}
