"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isInvoicingEnabled } from "@/lib/invoicing/feature-flag";
import type { InvoiceVatRateType } from "@/lib/types/database";

/** Factuurartikelen zijn puur een naslaglijst, geen geldbeweging -- volgt
 * daarom het gewone "!= 'readonly'"-patroon (elk niet-alleen-lezen teamlid
 * mag beheren), niet de strengere owner/admin-only-eis van facturen zelf. */
async function requireNotReadonly() {
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
  if (!isInvoicingEnabled(profile.organization_id)) {
    throw new Error("De facturenmodule is momenteel niet beschikbaar.");
  }
  if (profile.role === "readonly") throw new Error("Alleen-lezen teamleden mogen dit niet aanpassen.");

  return { supabase, organizationId: profile.organization_id };
}

export type CatalogItemFields = {
  name: string;
  description: string;
  unitPrice: number;
  vatRateType: InvoiceVatRateType;
  vatRateCustom: number | null;
};

export async function createCatalogItem(fields: CatalogItemFields) {
  const { supabase, organizationId } = await requireNotReadonly();
  const { error } = await supabase.from("invoice_catalog_items").insert({
    organization_id: organizationId,
    name: fields.name.trim(),
    description: fields.description.trim() || null,
    unit_price: fields.unitPrice,
    vat_rate_type: fields.vatRateType,
    vat_rate_custom: fields.vatRateType === "aangepast" ? fields.vatRateCustom : null,
  });
  if (error) throw error;
  revalidatePath("/dashboard/facturen/artikelen");
}

export async function updateCatalogItem(id: string, fields: CatalogItemFields) {
  const { supabase } = await requireNotReadonly();
  const { error } = await supabase
    .from("invoice_catalog_items")
    .update({
      name: fields.name.trim(),
      description: fields.description.trim() || null,
      unit_price: fields.unitPrice,
      vat_rate_type: fields.vatRateType,
      vat_rate_custom: fields.vatRateType === "aangepast" ? fields.vatRateCustom : null,
    })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/dashboard/facturen/artikelen");
}

export async function archiveCatalogItem(id: string) {
  const { supabase } = await requireNotReadonly();
  const { error } = await supabase.from("invoice_catalog_items").update({ archived_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
  revalidatePath("/dashboard/facturen/artikelen");
}

export async function unarchiveCatalogItem(id: string) {
  const { supabase } = await requireNotReadonly();
  const { error } = await supabase.from("invoice_catalog_items").update({ archived_at: null }).eq("id", id);
  if (error) throw error;
  revalidatePath("/dashboard/facturen/artikelen");
}

export async function deleteCatalogItem(id: string) {
  const { supabase } = await requireNotReadonly();
  const { error } = await supabase.from("invoice_catalog_items").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/dashboard/facturen/artikelen");
}
