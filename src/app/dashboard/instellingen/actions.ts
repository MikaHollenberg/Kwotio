"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify, SLUG_PATTERN } from "@/lib/organization/slug";
import type { UserRole, EmailTriggerType, LogoPreference } from "@/lib/types/database";

async function requireOwnerOrAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();
  if (!profile) throw new Error("Geen organisatie gevonden voor deze gebruiker.");
  if (profile.role !== "owner" && profile.role !== "admin") {
    throw new Error("Alleen eigenaren en admins mogen dit aanpassen.");
  }

  return { supabase, organizationId: profile.organization_id };
}

export type OrganizationSettingsFields = {
  name: string;
  brandName: string;
  domain: string;
  kvkNumber: string;
  btwNumber: string;
  iban: string;
  contactEmail: string;
  contactPhone: string;
  address: { street: string; postalCode: string; city: string; country: string };
  brandTheme: { primaryColor: string; secondaryColor: string };
};

export async function updateOrganizationSettings(fields: OrganizationSettingsFields) {
  const { supabase, organizationId } = await requireOwnerOrAdmin();
  const { error } = await supabase
    .from("organizations")
    .update({
      name: fields.name,
      brand_name: fields.brandName,
      domain: fields.domain || null,
      kvk_number: fields.kvkNumber || null,
      btw_number: fields.btwNumber || null,
      iban: fields.iban || null,
      contact_email: fields.contactEmail || null,
      contact_phone: fields.contactPhone || null,
      address: fields.address,
      brand_theme: fields.brandTheme,
    })
    .eq("id", organizationId);
  if (error) throw error;
  revalidatePath("/dashboard/instellingen");
}

export async function updateOrganizationLogo(field: "horizontal" | "square", logoUrl: string) {
  const { supabase, organizationId } = await requireOwnerOrAdmin();
  const update = field === "horizontal" ? { logo_horizontal_url: logoUrl || null } : { logo_square_url: logoUrl || null };
  const { error } = await supabase.from("organizations").update(update).eq("id", organizationId);
  if (error) throw error;
  revalidatePath("/dashboard/instellingen");
}

export async function updateLogoPreference(preference: LogoPreference) {
  const { supabase, organizationId } = await requireOwnerOrAdmin();
  const { error } = await supabase
    .from("organizations")
    .update({ logo_preference: preference })
    .eq("id", organizationId);
  if (error) throw error;
  revalidatePath("/dashboard/instellingen");
}

export async function updateOrganizationTerms(termsUrl: string) {
  const { supabase, organizationId } = await requireOwnerOrAdmin();
  const { error } = await supabase
    .from("organizations")
    .update({ terms_url: termsUrl || null })
    .eq("id", organizationId);
  if (error) throw error;
  revalidatePath("/dashboard/instellingen");
}

export async function updateReviewUrl(reviewUrl: string) {
  const { supabase, organizationId } = await requireOwnerOrAdmin();
  const { error } = await supabase
    .from("organizations")
    .update({ review_url: reviewUrl || null })
    .eq("id", organizationId);
  if (error) throw error;
  revalidatePath("/dashboard/instellingen");
}

/**
 * Slug voor de publieke organisatiepagina (/offertes/[slug]) — door een
 * eigenaar/admin zelf aan te passen. Zelfde vriendelijke-conflictmelding-
 * patroon als de super-admin-variant in admin/organisaties/actions.ts.
 */
export async function updatePublicSlug(slug: string) {
  const { supabase, organizationId } = await requireOwnerOrAdmin();
  const normalized = slugify(slug);
  if (!normalized || !SLUG_PATTERN.test(normalized)) {
    throw new Error("Ongeldige link — gebruik alleen kleine letters, cijfers en streepjes.");
  }
  const { error } = await supabase.from("organizations").update({ public_slug: normalized }).eq("id", organizationId);
  if (error) {
    if (error.code === "23505") throw new Error("Deze link is al in gebruik door een andere organisatie.");
    throw error;
  }
  revalidatePath("/dashboard/instellingen");
}

export async function updatePublicWelcomeMessage(message: string) {
  const { supabase, organizationId } = await requireOwnerOrAdmin();
  const { error } = await supabase
    .from("organizations")
    .update({ public_welcome_message: message.trim() || null })
    .eq("id", organizationId);
  if (error) throw error;
  revalidatePath("/dashboard/instellingen");
}

export async function updateGuestCountFieldSettings(fields: { active: boolean; label: string }) {
  const { supabase, organizationId } = await requireOwnerOrAdmin();
  const { error } = await supabase
    .from("organizations")
    .update({
      guest_count_field_active: fields.active,
      guest_count_field_label: fields.label || null,
    })
    .eq("id", organizationId);
  if (error) throw error;
  revalidatePath("/dashboard/instellingen");
}

export async function updateHeadcountSettings(fields: { actief: boolean; kanttekening: string }) {
  const { supabase, organizationId } = await requireOwnerOrAdmin();
  const { error } = await supabase
    .from("organizations")
    .update({
      aantal_personen_actief: fields.actief,
      aantal_personen_kanttekening: fields.kanttekening || null,
    })
    .eq("id", organizationId);
  if (error) throw error;
  revalidatePath("/dashboard/instellingen");
}

export type EmailRuleFields = {
  name: string;
  triggerType: EmailTriggerType;
  triggerDays: number;
  subject: string;
  body: string;
  enabled: boolean;
};

export async function createEmailRule(fields: EmailRuleFields) {
  const { supabase, organizationId } = await requireOwnerOrAdmin();
  const { data, error } = await supabase
    .from("email_automation_rules")
    .insert({
      organization_id: organizationId,
      name: fields.name,
      trigger_type: fields.triggerType,
      trigger_days: fields.triggerDays,
      subject: fields.subject,
      body: fields.body,
      enabled: fields.enabled,
    })
    .select("id")
    .single();
  if (error) throw error;
  revalidatePath("/dashboard/instellingen");
  return data.id as string;
}

export async function updateEmailRule(ruleId: string, fields: EmailRuleFields) {
  const { supabase } = await requireOwnerOrAdmin();
  const { error } = await supabase
    .from("email_automation_rules")
    .update({
      name: fields.name,
      trigger_type: fields.triggerType,
      trigger_days: fields.triggerDays,
      subject: fields.subject,
      body: fields.body,
      enabled: fields.enabled,
    })
    .eq("id", ruleId);
  if (error) throw error;
  revalidatePath("/dashboard/instellingen");
}

export async function deleteEmailRule(ruleId: string) {
  const { supabase } = await requireOwnerOrAdmin();
  const { error } = await supabase.from("email_automation_rules").delete().eq("id", ruleId);
  if (error) throw error;
  revalidatePath("/dashboard/instellingen");
}

export async function inviteTeamMember(email: string, role: UserRole) {
  const { organizationId } = await requireOwnerOrAdmin();
  const admin = createAdminClient();

  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { organization_id: organizationId, role },
  });
  if (error) throw error;

  revalidatePath("/dashboard/instellingen");
}

export async function updateMemberRole(memberId: string, role: UserRole) {
  const { supabase } = await requireOwnerOrAdmin();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", memberId);
  if (error) throw error;
  revalidatePath("/dashboard/instellingen");
}

export async function removeMember(memberId: string) {
  const { supabase } = await requireOwnerOrAdmin();
  const admin = createAdminClient();

  await supabase.from("profiles").delete().eq("id", memberId);
  await admin.auth.admin.deleteUser(memberId);

  revalidatePath("/dashboard/instellingen");
}

export async function addClosedDate(date: string, reason: string) {
  const { supabase, organizationId } = await requireOwnerOrAdmin();
  const { error } = await supabase
    .from("closed_dates")
    .insert({ organization_id: organizationId, date, reason: reason.trim() || null });
  if (error) {
    if (error.code === "23505") throw new Error("Deze datum staat al in de lijst.");
    throw error;
  }
  revalidatePath("/dashboard/instellingen");
}

export async function deleteClosedDate(id: string) {
  const { supabase } = await requireOwnerOrAdmin();
  const { error } = await supabase.from("closed_dates").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/dashboard/instellingen");
}
