"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ArrangementAvailabilityStatus, ArrangementPriceUnit, PriceDisplayMode } from "@/lib/types/database";
import type { ArrangementContentItem } from "@/lib/arrangements/types";

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
  publicDescription: string;
  category: string;
  colorCode: string;
  priceDisplay: PriceDisplayMode;
  isPubliclyVisible: boolean;
  contentItems: ArrangementContentItem[];
  pdfUrl: string;
};

export async function createArrangement(fields: ArrangementFields) {
  const { supabase, organizationId } = await requireNotReadonly();
  const { data, error } = await supabase
    .from("arrangements")
    .insert({
      organization_id: organizationId,
      name: fields.name.trim(),
      description: fields.description.trim(),
      public_description: fields.publicDescription.trim(),
      category: fields.category.trim(),
      color_code: fields.colorCode,
      price_display: fields.priceDisplay,
      is_publicly_visible: fields.isPubliclyVisible,
      content_items: fields.contentItems,
      pdf_url: fields.pdfUrl.trim() || null,
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
      public_description: fields.publicDescription.trim(),
      category: fields.category.trim(),
      color_code: fields.colorCode,
      price_display: fields.priceDisplay,
      is_publicly_visible: fields.isPubliclyVisible,
      content_items: fields.contentItems,
      pdf_url: fields.pdfUrl.trim() || null,
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

export type ArrangementPriceInput = { label: string; unit: ArrangementPriceUnit; amount: number };

/** Vervangt de "altijd actieve" prijsregels (die niet bij een seizoen horen)
 * van dit arrangement in één keer -- er is geen klant-facing selectie-
 * stabiliteit zoals bij offerte-pakketten om te bewaren, dus delete-en-
 * opnieuw-invoegen is hier prima (zelfde aanpak als updateInvoiceLines). */
export async function updateArrangementPrices(arrangementId: string, prices: ArrangementPriceInput[]) {
  const { supabase } = await requireNotReadonly();
  const { error: deleteError } = await supabase
    .from("arrangement_prices")
    .delete()
    .eq("arrangement_id", arrangementId)
    .is("season_id", null);
  if (deleteError) throw deleteError;

  if (prices.length > 0) {
    const { error: insertError } = await supabase.from("arrangement_prices").insert(
      prices.map((p, index) => ({
        arrangement_id: arrangementId,
        label: p.label.trim(),
        unit: p.unit,
        amount: p.amount,
        sort_order: index,
      })),
    );
    if (insertError) throw insertError;
  }
  revalidatePath(`/dashboard/arrangementen/${arrangementId}`);
}

export type ArrangementSeasonInput = {
  label: string;
  startDate: string;
  endDate: string;
  prices: ArrangementPriceInput[];
};

/** Vervangt alle seizoenen (en hun eigen prijsregels, via cascade-delete)
 * in één keer. Seizoenen worden na elkaar aangemaakt (niet in bulk) omdat
 * elk seizoen eerst zijn eigen id nodig heeft voordat de bijbehorende
 * prijsregels ernaar kunnen verwijzen. */
export async function updateArrangementSeasons(arrangementId: string, seasons: ArrangementSeasonInput[]) {
  const { supabase } = await requireNotReadonly();
  const { error: deleteError } = await supabase.from("arrangement_seasons").delete().eq("arrangement_id", arrangementId);
  if (deleteError) throw deleteError;

  for (const [index, season] of seasons.entries()) {
    const { data: inserted, error: seasonError } = await supabase
      .from("arrangement_seasons")
      .insert({
        arrangement_id: arrangementId,
        label: season.label.trim(),
        start_date: season.startDate,
        end_date: season.endDate,
        sort_order: index,
      })
      .select("id")
      .single();
    if (seasonError) throw seasonError;

    if (season.prices.length > 0) {
      const { error: priceError } = await supabase.from("arrangement_prices").insert(
        season.prices.map((p, priceIndex) => ({
          arrangement_id: arrangementId,
          season_id: inserted.id,
          label: p.label.trim(),
          unit: p.unit,
          amount: p.amount,
          sort_order: priceIndex,
        })),
      );
      if (priceError) throw priceError;
    }
  }
  revalidatePath(`/dashboard/arrangementen/${arrangementId}`);
}

export type ArrangementSurchargeInput = {
  label: string;
  minGuests: number;
  maxGuests: number | null;
  unit: ArrangementPriceUnit;
  amount: number;
};

/** Toeslagen zijn puur informatief (zie ArrangementBlockContent.surcharges)
 * -- zelfde delete-en-opnieuw-invoegen-aanpak. */
export async function updateArrangementSurcharges(arrangementId: string, surcharges: ArrangementSurchargeInput[]) {
  const { supabase } = await requireNotReadonly();
  const { error: deleteError } = await supabase.from("arrangement_surcharges").delete().eq("arrangement_id", arrangementId);
  if (deleteError) throw deleteError;

  if (surcharges.length > 0) {
    const { error: insertError } = await supabase.from("arrangement_surcharges").insert(
      surcharges.map((s, index) => ({
        arrangement_id: arrangementId,
        label: s.label.trim(),
        min_guests: s.minGuests,
        max_guests: s.maxGuests,
        unit: s.unit,
        amount: s.amount,
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
