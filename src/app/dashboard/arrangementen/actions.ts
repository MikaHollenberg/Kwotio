"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ArrangementAvailabilityStatus, ArrangementPricingMode } from "@/lib/types/database";
import type { ArrangementInclusiefSection, ArrangementExtra } from "@/lib/arrangements/types";

/** Arrangementen zijn een catalogus, geen geldbeweging op zich (dat gebeurt
 * pas in een offerte) -- zelfde soepele "!= 'readonly'"-patroon als
 * factuurartikelen/templates: elk niet-alleen-lezen teamlid mag beheren. */
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
  if (profile.role === "readonly") throw new Error("Alleen-lezen teamleden mogen dit niet aanpassen.");

  return { supabase, organizationId: profile.organization_id };
}

export type ArrangementFields = {
  name: string;
  description: string;
  category: string;
  colorCode: string;
  basePrice: number;
  pricingMode: ArrangementPricingMode;
  inclusiefSections: ArrangementInclusiefSection[];
  highlightTitle: string;
  highlightText: string;
  extras: ArrangementExtra[];
};

export async function createArrangement(fields: ArrangementFields) {
  const { supabase, organizationId } = await requireNotReadonly();
  const { data, error } = await supabase
    .from("arrangements")
    .insert({
      organization_id: organizationId,
      name: fields.name.trim(),
      description: fields.description.trim(),
      category: fields.category.trim(),
      color_code: fields.colorCode,
      base_price: fields.basePrice,
      pricing_mode: fields.pricingMode,
      inclusief_sections: fields.inclusiefSections,
      highlight_title: fields.highlightTitle.trim() || null,
      highlight_text: fields.highlightText.trim() || null,
      extras: fields.extras,
    })
    .select("id")
    .single();
  if (error) throw error;
  revalidatePath("/dashboard/arrangementen");
  return { id: data.id as string };
}

export async function updateArrangement(id: string, fields: ArrangementFields) {
  const { supabase } = await requireNotReadonly();
  const { error } = await supabase
    .from("arrangements")
    .update({
      name: fields.name.trim(),
      description: fields.description.trim(),
      category: fields.category.trim(),
      color_code: fields.colorCode,
      base_price: fields.basePrice,
      pricing_mode: fields.pricingMode,
      inclusief_sections: fields.inclusiefSections,
      highlight_title: fields.highlightTitle.trim() || null,
      highlight_text: fields.highlightText.trim() || null,
      extras: fields.extras,
    })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/dashboard/arrangementen");
  revalidatePath(`/dashboard/arrangementen/${id}`);
}

export async function archiveArrangement(id: string) {
  const { supabase } = await requireNotReadonly();
  const { error } = await supabase.from("arrangements").update({ archived_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
  revalidatePath("/dashboard/arrangementen");
}

export async function unarchiveArrangement(id: string) {
  const { supabase } = await requireNotReadonly();
  const { error } = await supabase.from("arrangements").update({ archived_at: null }).eq("id", id);
  if (error) throw error;
  revalidatePath("/dashboard/arrangementen");
}

export async function deleteArrangement(id: string) {
  const { supabase } = await requireNotReadonly();
  const { error } = await supabase.from("arrangements").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/dashboard/arrangementen");
}

/** Drag-and-drop-volgorde op de kaartenlijst -- eenvoudige bulk-update,
 * zelfde soort aanpak als elders (geen los RPC nodig voor zo'n kleine set). */
export async function reorderArrangements(orderedIds: string[]) {
  const { supabase } = await requireNotReadonly();
  await Promise.all(
    orderedIds.map((id, index) => supabase.from("arrangements").update({ sort_order: index }).eq("id", id)),
  );
  revalidatePath("/dashboard/arrangementen");
}

export type PriceTierInput = { minGuests: number; maxGuests: number | null; price: number };

/** Vervangt alle staffelprijzen van dit arrangement in één keer -- er is
 * geen klant-facing selectiestabiliteit zoals bij offerte-pakketten om te
 * bewaren, dus delete-en-opnieuw-invoegen is hier prima (zelfde aanpak als
 * updateInvoiceLines). */
export async function updatePriceTiers(arrangementId: string, tiers: PriceTierInput[]) {
  const { supabase } = await requireNotReadonly();
  const { error: deleteError } = await supabase
    .from("arrangement_price_tiers")
    .delete()
    .eq("arrangement_id", arrangementId);
  if (deleteError) throw deleteError;

  if (tiers.length > 0) {
    const { error: insertError } = await supabase.from("arrangement_price_tiers").insert(
      tiers.map((t, index) => ({
        arrangement_id: arrangementId,
        min_guests: t.minGuests,
        max_guests: t.maxGuests,
        price: t.price,
        sort_order: index,
      })),
    );
    if (insertError) throw insertError;
  }
  revalidatePath(`/dashboard/arrangementen/${arrangementId}`);
}

export type SeasonPriceInput = { label: string; startDate: string; endDate: string; price: number };

export async function updateSeasonPrices(arrangementId: string, seasons: SeasonPriceInput[]) {
  const { supabase } = await requireNotReadonly();
  const { error: deleteError } = await supabase
    .from("arrangement_season_prices")
    .delete()
    .eq("arrangement_id", arrangementId);
  if (deleteError) throw deleteError;

  if (seasons.length > 0) {
    const { error: insertError } = await supabase.from("arrangement_season_prices").insert(
      seasons.map((s, index) => ({
        arrangement_id: arrangementId,
        label: s.label.trim(),
        start_date: s.startDate,
        end_date: s.endDate,
        price: s.price,
        sort_order: index,
      })),
    );
    if (insertError) throw insertError;
  }
  revalidatePath(`/dashboard/arrangementen/${arrangementId}`);
}

/** `status: null` verwijdert de uitzondering weer -- een datum zonder rij
 * telt standaard als "beschikbaar" (zie ook de kalender-UI). */
export async function setArrangementAvailability(
  arrangementId: string,
  date: string,
  status: ArrangementAvailabilityStatus | null,
) {
  const { supabase } = await requireNotReadonly();
  if (status === null) {
    const { error } = await supabase
      .from("arrangement_availability")
      .delete()
      .eq("arrangement_id", arrangementId)
      .eq("date", date);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("arrangement_availability")
      .upsert({ arrangement_id: arrangementId, date, status }, { onConflict: "arrangement_id,date" });
    if (error) throw error;
  }
  revalidatePath(`/dashboard/arrangementen/${arrangementId}`);
}
