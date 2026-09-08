import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";

/** Toegestane tekens voor een handmatig ingevoerde slug (lowercase, cijfers, streepjes). */
export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Ruwe naam -> url-vriendelijke basis-slug (zonder uniciteitscontrole). */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // accenten weghalen
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
}

/**
 * Genereert een unieke slug op basis van een naam: bij een botsing met een
 * bestaande organisatie wordt een oplopend cijfer toegevoegd (-2, -3, …).
 * Gebruikt bij het aanmaken van een nieuwe organisatie (admin/organisaties)
 * — dezelfde logica als de backfill in migratie 0031.
 */
export async function generateUniqueOrganizationSlug(
  admin: ReturnType<typeof createAdminClient>,
  name: string,
): Promise<string> {
  const base = slugify(name) || "organisatie";
  let candidate = base;
  let suffix = 2;
  for (;;) {
    const { data } = await admin.from("organizations").select("id").eq("public_slug", candidate).maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}
