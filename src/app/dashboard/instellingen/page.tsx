import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Building2, Globe, CalendarOff, Receipt, Mail, Users, Download, type LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { EmailAutomationCard, type EmailRule } from "./email-automation-card";
import { TeamCard, type TeamMember } from "./team-card";
import { OrganizationSettingsCard } from "./organization-settings-card";
import { PublicPageSettingsCard } from "./public-page-settings-card";
import { HeadcountSettingsCard } from "./headcount-settings-card";
import { ClosedDatesCard } from "./closed-dates-card";
import { DataExportCard } from "./data-export-card";
import { InvoicingSettingsCard } from "./invoicing-settings-card";
import { InvoiceEmailTemplatesCard } from "./invoice-email-templates-card";
import { SettingsSection } from "./settings-section";

/** Icoon-vlakje voor een SettingsSection-header -- gerenderd HIER (Server
 * Component) i.p.v. de kale Lucide-componentreferentie als prop door te
 * geven aan SettingsSection (Client Component): dat laatste crasht met
 * "Only plain objects can be passed to Client Components...", een al
 * gerenderd element werkt wel over die grens heen. */
function IconBox({ icon: Icon, bg, color }: { icon: LucideIcon; bg: string; color: string }) {
  return (
    <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-brand-sm", bg, color)}>
      <Icon className="size-5" />
    </div>
  );
}

export default async function InstellingenPage() {
  const supabase = await createClient();
  const h = await headers();
  const publicPageOrigin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .eq("id", user!.id)
    .single();
  if (profile?.role !== "owner" && profile?.role !== "admin") redirect("/dashboard");

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

  const { data: closedDateRows } = profile
    ? await supabase
        .from("closed_dates")
        .select("id, date, reason")
        .eq("organization_id", profile.organization_id)
    : { data: null };

  const canManageOrg = profile?.role === "owner" || profile?.role === "admin";

  const address = (organization?.address as { street?: string; postalCode?: string; city?: string; country?: string } | null) ?? {};
  const brandTheme = (organization?.brand_theme as { primaryColor?: string; secondaryColor?: string } | null) ?? {};

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold text-ink-500">Instellingen</h1>
        <p className="text-sm text-ink-400">
          Alles wat jullie organisatie, offertes en facturen bepaalt — per onderwerp gegroepeerd.
        </p>
      </div>

      <SettingsSection
        icon={<IconBox icon={Building2} bg="bg-blue-50" color="text-blue-600" />}
        title="Bedrijfsgegevens"
        summary="Naam, contactgegevens, logo's, huisstijlkleuren, algemene voorwaarden"
        faqId="settings-organisatie"
        defaultOpen
        style={{ animationDelay: "0ms" }}
      >
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
      </SettingsSection>

      <SettingsSection
        icon={<IconBox icon={Globe} bg="bg-teal-50" color="text-teal-600" />}
        title="Publieke offertepagina"
        summary="Link, welkomsttekst, achtergrondstijl, locatiefoto, aanvraagformulier"
        style={{ animationDelay: "55ms" }}
      >
        <PublicPageSettingsCard
          organizationId={profile!.organization_id}
          canEdit={canManageOrg}
          brandName={organization?.brand_name ?? ""}
          publicPageOrigin={publicPageOrigin}
          initialPublicSlug={organization?.public_slug ?? ""}
          initialWelcomeMessage={organization?.public_welcome_message ?? ""}
          initialGuestCountActive={organization?.guest_count_field_active ?? false}
          initialGuestCountLabel={organization?.guest_count_field_label ?? ""}
          initialBackgroundStyle={organization?.public_page_background_style ?? "none"}
          initialLocationPhotoUrl={organization?.location_photo_url ?? null}
          initialLocationCaption={organization?.location_caption ?? null}
        />
        <HeadcountSettingsCard
          initialActief={organization?.aantal_personen_actief ?? false}
          initialKanttekening={organization?.aantal_personen_kanttekening ?? ""}
          canEdit={canManageOrg}
        />
      </SettingsSection>

      <SettingsSection
        icon={<IconBox icon={CalendarOff} bg="bg-amber-50" color="text-amber-600" />}
        title="Beschikbaarheid"
        summary="Gesloten dagen en een vaste wekelijkse sluitingsdag"
        faqId="settings-gesloten-dagen"
        style={{ animationDelay: "110ms" }}
      >
        <ClosedDatesCard
          closedDates={closedDateRows ?? []}
          closedWeekdays={organization?.closed_weekdays ?? []}
          canEdit={canManageOrg}
        />
      </SettingsSection>

      <SettingsSection
        icon={<IconBox icon={Receipt} bg="bg-emerald-50" color="text-emerald-600" />}
        title="Facturatie"
        summary="Nummering, btw-tarieven, betaaltermijn, Mollie, e-mailteksten"
        faqId="settings-facturatie"
        style={{ animationDelay: "165ms" }}
      >
        <InvoicingSettingsCard
          canEdit={canManageOrg}
          organizationId={profile!.organization_id}
          initialPrefix={organization?.invoice_number_prefix ?? ""}
          initialDueDays={organization?.invoice_due_days ?? 14}
          initialAutoSend={organization?.invoice_auto_send ?? false}
          initialReminderEnabled={organization?.invoice_reminder_enabled ?? true}
          initialVatRateHigh={organization?.invoice_vat_rate_high ?? 21}
          initialVatRateLow={organization?.invoice_vat_rate_low ?? 9}
          initialExtraLogoUrls={organization?.invoice_extra_logo_urls ?? []}
          maskedMollieKey={organization?.mollie_api_key ? `•••• ${organization.mollie_api_key.slice(-4)}` : null}
          hasBtwOrKvk={Boolean(organization?.btw_number || organization?.kvk_number)}
        />
        <InvoiceEmailTemplatesCard
          canEdit={canManageOrg}
          initialSentSubject={organization?.invoice_sent_email_subject ?? ""}
          initialSentBody={organization?.invoice_sent_email_body ?? ""}
          initialReminderSubject={organization?.invoice_reminder_email_subject ?? ""}
          initialReminderBody={organization?.invoice_reminder_email_body ?? ""}
        />
      </SettingsSection>

      <SettingsSection
        icon={<IconBox icon={Mail} bg="bg-purple-50" color="text-purple-600" />}
        title="E-mailautomatisering"
        summary="Automatische klant-e-mails en de review-link"
        faqId="settings-email-automatisering"
        style={{ animationDelay: "220ms" }}
      >
        <EmailAutomationCard rules={emailRules} canEdit={canManageOrg} initialReviewUrl={organization?.review_url ?? null} />
      </SettingsSection>

      {canManageOrg && (
        <SettingsSection
          icon={<IconBox icon={Users} bg="bg-rose-50" color="text-rose-600" />}
          title="Team & rechten"
          summary="Teamleden uitnodigen en rollen beheren"
          faqId="settings-team"
          style={{ animationDelay: "275ms" }}
        >
          <TeamCard members={members} currentUserId={user!.id} />
        </SettingsSection>
      )}

      {canManageOrg && (
        <SettingsSection
          icon={<IconBox icon={Download} bg="bg-slate-100" color="text-slate-600" />}
          title="Data & privacy"
          summary="Exporteer al jullie klant-, offerte- en templategegevens"
          faqId="settings-data-exporteren"
          style={{ animationDelay: "330ms" }}
        >
          <DataExportCard organizationId={profile!.organization_id} />
        </SettingsSection>
      )}
    </div>
  );
}
