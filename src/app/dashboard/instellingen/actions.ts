"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
