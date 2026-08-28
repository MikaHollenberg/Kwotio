import { createClient } from "@/lib/supabase/server";
import { EmailAutomationCard, type EmailRule } from "./email-automation-card";
import { TeamCard, type TeamMember } from "./team-card";
import { OrganizationSettingsCard } from "./organization-settings-card";
import { HeadcountSettingsCard } from "./headcount-settings-card";

export default async function InstellingenPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .eq("id", user!.id)
    .single();

  const { data: organization } = profile
    ? await supabase
        .from("organizations")
        .select("*")
        .eq("id", profile.organization_id)
        .single()
    : { data: null };

  const { data: memberProfiles } = profile
    ? await supabase
        .from("profiles")
        .select("id, full_name, email, role")
        .eq("organization_id", profile.organization_id)
        .order("created_at", { ascending: true })
    : { data: null };

  const members: TeamMember[] = (memberProfiles ?? []).map((m) => ({
    id: m.id,
    fullName: m.full_name,
    email: m.email,
    role: m.role,
  }));

  const { data: emailRuleRows } = profile
    ? await supabase
        .from("email_automation_rules")
        .select("*")
        .eq("organization_id", profile.organization_id)
        .order("sort_order", { ascending: true })
    : { data: null };

  const emailRules: EmailRule[] = (emailRuleRows ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    triggerType: r.trigger_type,
    triggerDays: r.trigger_days,
    subject: r.subject,
    body: r.body,
    enabled: r.enabled,
  }));

  const canManageOrg = profile?.role === "owner" || profile?.role === "admin";

  const address = (organization?.address as { street?: string; postalCode?: string; city?: string; country?: string } | null) ?? {};
  const brandTheme = (organization?.brand_theme as { primaryColor?: string; secondaryColor?: string } | null) ?? {};

  return (
    <div className="flex flex-col gap-6">
      <OrganizationSettingsCard
        organizationId={profile!.organization_id}
        canEdit={canManageOrg}
        initialLogoHorizontalUrl={organization?.logo_horizontal_url ?? null}
        initialLogoSquareUrl={organization?.logo_square_url ?? null}
        initialLogoPreference={organization?.logo_preference ?? "horizontaal"}
        initialTermsUrl={organization?.terms_url ?? null}
        initial={{
          name: organization?.name ?? "",
          brandName: organization?.brand_name ?? "",
          domain: organization?.domain ?? "",
          kvkNumber: organization?.kvk_number ?? "",
          btwNumber: organization?.btw_number ?? "",
          iban: organization?.iban ?? "",
          contactEmail: organization?.contact_email ?? "",
          contactPhone: organization?.contact_phone ?? "",
          address: {
            street: address.street ?? "",
            postalCode: address.postalCode ?? "",
            city: address.city ?? "",
            country: address.country ?? "Nederland",
          },
          brandTheme: {
            primaryColor: brandTheme.primaryColor ?? "",
            secondaryColor: brandTheme.secondaryColor ?? "",
          },
        }}
      />

      <HeadcountSettingsCard
        initialActief={organization?.aantal_personen_actief ?? false}
        initialKanttekening={organization?.aantal_personen_kanttekening ?? ""}
        canEdit={canManageOrg}
      />

      <EmailAutomationCard rules={emailRules} canEdit={canManageOrg} />

      {canManageOrg && <TeamCard members={members} currentUserId={user!.id} />}
    </div>
  );
}
