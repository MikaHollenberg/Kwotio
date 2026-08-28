"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole, OrgStatus } from "@/lib/types/database";

function generateTempPassword() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < 14; i++) password += chars[randomInt(chars.length)];
  return password;
}

export type OrganizationFields = {
  name: string;
  brandName: string;
  domain: string;
  kvkNumber: string;
  btwNumber: string;
  iban: string;
  contactEmail: string;
  contactPhone: string;
  address: { street: string; postalCode: string; city: string; country: string };
  plan: string;
  monthlyPrice: number;
  status: OrgStatus;
};

function toRow(fields: OrganizationFields) {
  return {
    name: fields.name,
    brand_name: fields.brandName,
    domain: fields.domain || null,
    kvk_number: fields.kvkNumber || null,
    btw_number: fields.btwNumber || null,
    iban: fields.iban || null,
    contact_email: fields.contactEmail || null,
    contact_phone: fields.contactPhone || null,
    address: fields.address,
    plan: fields.plan || null,
    monthly_price: fields.monthlyPrice,
    status: fields.status,
  };
}

export async function createOrganization(
  fields: OrganizationFields,
  owner: { email: string; fullName: string },
) {
  await requireSuperAdmin();
  const admin = createAdminClient();

  const { data: org, error: orgError } = await admin
    .from("organizations")
    .insert(toRow(fields))
    .select("id")
    .single();
  if (orgError) throw orgError;

  const tempPassword = generateTempPassword();
  const { error: userError } = await admin.auth.admin.createUser({
    email: owner.email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { organization_id: org.id, role: "owner" satisfies UserRole, full_name: owner.fullName },
  });
  if (userError) {
    await admin.from("organizations").delete().eq("id", org.id);
    throw userError;
  }

  revalidatePath("/admin/organisaties");
  return { organizationId: org.id as string, tempPassword };
}

export async function updateOrganization(organizationId: string, fields: OrganizationFields) {
  await requireSuperAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("organizations").update(toRow(fields)).eq("id", organizationId);
  if (error) throw error;
  revalidatePath(`/admin/organisaties/${organizationId}`);
  revalidatePath("/admin/organisaties");
}

export async function updateOrganizationLogo(organizationId: string, field: "horizontal" | "square", logoUrl: string) {
  await requireSuperAdmin();
  const admin = createAdminClient();
  const update = field === "horizontal" ? { logo_horizontal_url: logoUrl || null } : { logo_square_url: logoUrl || null };
  const { error } = await admin.from("organizations").update(update).eq("id", organizationId);
  if (error) throw error;
  revalidatePath(`/admin/organisaties/${organizationId}`);
}

export async function updateOrganizationLogoPreference(organizationId: string, preference: "horizontaal" | "vierkant") {
  await requireSuperAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("organizations")
    .update({ logo_preference: preference })
    .eq("id", organizationId);
  if (error) throw error;
  revalidatePath(`/admin/organisaties/${organizationId}`);
}

export async function uploadOrganizationLogo(organizationId: string, field: "horizontal" | "square", formData: FormData) {
  await requireSuperAdmin();
  const file = formData.get("file") as File | null;
  if (!file) throw new Error("Geen bestand ontvangen.");

  const admin = createAdminClient();
  const ext = file.name.split(".").pop() ?? "png";
  const path = `${organizationId}/logo/${field}-${crypto.randomUUID()}.${ext}`;
  const { error } = await admin.storage.from("quote-media").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;

  const { data } = admin.storage.from("quote-media").getPublicUrl(path);
  await updateOrganizationLogo(organizationId, field, data.publicUrl);
  return data.publicUrl;
}

export async function addOrganizationMember(
  organizationId: string,
  fields: { email: string; fullName: string; role: UserRole },
) {
  await requireSuperAdmin();
  const admin = createAdminClient();

  const tempPassword = generateTempPassword();
  const { error } = await admin.auth.admin.createUser({
    email: fields.email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { organization_id: organizationId, role: fields.role, full_name: fields.fullName },
  });
  if (error) throw error;

  revalidatePath(`/admin/organisaties/${organizationId}`);
  return { tempPassword };
}

export async function updateOrganizationMemberRole(memberId: string, role: UserRole) {
  await requireSuperAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ role }).eq("id", memberId);
  if (error) throw error;
}

export async function removeOrganizationMember(organizationId: string, memberId: string) {
  await requireSuperAdmin();
  const admin = createAdminClient();
  await admin.from("profiles").delete().eq("id", memberId);
  await admin.auth.admin.deleteUser(memberId);
  revalidatePath(`/admin/organisaties/${organizationId}`);
}

export async function resetOrganizationMemberPassword(memberId: string) {
  await requireSuperAdmin();
  const admin = createAdminClient();
  const tempPassword = generateTempPassword();
  const { error } = await admin.auth.admin.updateUserById(memberId, { password: tempPassword });
  if (error) throw error;
  return { tempPassword };
}

export async function archiveOrganization(organizationId: string) {
  await requireSuperAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("organizations")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", organizationId);
  if (error) throw error;
  revalidatePath("/admin/organisaties");
  revalidatePath("/admin/organisaties/archief");
}

export async function unarchiveOrganization(organizationId: string) {
  await requireSuperAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("organizations")
    .update({ archived_at: null })
    .eq("id", organizationId);
  if (error) throw error;
  revalidatePath("/admin/organisaties");
  revalidatePath("/admin/organisaties/archief");
}

/**
 * Definitief verwijderen — geen soft delete. Cascade in 0001_init.sql
 * verwijdert clients/templates/quotes/profiles etc. automatisch mee, maar
 * de bijbehorende auth.users-accounts moeten apart via de admin-API
 * verwijderd worden (die vallen buiten de database-cascade).
 */
export async function deleteOrganization(organizationId: string) {
  await requireSuperAdmin();
  const admin = createAdminClient();

  const { data: members } = await admin.from("profiles").select("id").eq("organization_id", organizationId);
  for (const member of members ?? []) {
    await admin.auth.admin.deleteUser(member.id);
  }

  const { error } = await admin.from("organizations").delete().eq("id", organizationId);
  if (error) throw error;

  revalidatePath("/admin/organisaties");
  revalidatePath("/admin/organisaties/archief");
}
