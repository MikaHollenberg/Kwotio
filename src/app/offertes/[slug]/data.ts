import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadTemplateBlocks } from "@/lib/blocks/persistence";
import { resolvePreferredLogo } from "@/lib/organization/logo";
import type { BlockDraft } from "@/lib/blocks/types";

export type PublicOrgTemplate = {
  id: string;
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  blocks: BlockDraft[];
};

export type PublicOrgPageData = {
  organizationId: string;
  organizationName: string;
  logoUrl: string | null;
  termsUrl: string | null;
  welcomeMessage: string | null;
  guestCountFieldActive: boolean;
  guestCountFieldLabel: string;
  /** organizations.brand_theme.primaryColor — valt terug op Kwotio's eigen
   * oranje als de organisatie nog geen eigen huisstijlkleur heeft ingesteld. */
  primaryColor: string;
  templates: PublicOrgTemplate[];
};

const DEFAULT_PRIMARY_COLOR = "#CC7A3E";

/**
 * Enige toegangspad voor de publieke organisatiepagina: alles wordt
 * opgezocht via de public_slug (service-role client, zelfde
 * "share_token = enige sleutel"-filosofie als de publieke offertepagina —
 * hier is de slug de sleutel), en er wordt alleen geselecteerd wat
 * daadwerkelijk publiek bedoeld is. Interne velden (marges, kvk/btw,
 * interne notities) zitten hier expliciet niet in de select.
 *
 * Alle publiek zichtbare templates worden in één keer mét hun blokken
 * opgehaald (het aantal publieke templates per organisatie is doorgaans
 * klein), zodat de klant tussen templates kan wisselen zonder dat daar een
 * losse serveraanroep per klik voor nodig is.
 */
export async function getPublicOrgPageData(slug: string): Promise<PublicOrgPageData | null> {
  const supabase = createAdminClient();

  const { data: organization, error: orgError } = await supabase
    .from("organizations")
    .select(
      "id, brand_name, logo_horizontal_url, logo_square_url, logo_preference, terms_url, public_welcome_message, guest_count_field_active, guest_count_field_label, brand_theme, archived_at",
    )
    .eq("public_slug", slug)
    .maybeSingle();
  if (orgError) throw orgError;
  if (!organization || organization.archived_at) return null;

  const { data: templateRows, error: templateError } = await supabase
    .from("templates")
    .select("id, name, description, thumbnail_url")
    .eq("organization_id", organization.id)
    .eq("is_publicly_visible", true)
    .eq("is_active", true)
    .is("archived_at", null)
    .order("name", { ascending: true });
  if (templateError) throw templateError;

  const templates: PublicOrgTemplate[] = await Promise.all(
    (templateRows ?? []).map(async (t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      thumbnailUrl: t.thumbnail_url,
      blocks: await loadTemplateBlocks(supabase, t.id),
    })),
  );

  return {
    organizationId: organization.id,
    organizationName: organization.brand_name,
    logoUrl: resolvePreferredLogo(organization),
    termsUrl: organization.terms_url,
    welcomeMessage: organization.public_welcome_message,
    guestCountFieldActive: organization.guest_count_field_active,
    guestCountFieldLabel: organization.guest_count_field_label || "Aantal personen",
    primaryColor: (organization.brand_theme as { primaryColor?: string } | null)?.primaryColor || DEFAULT_PRIMARY_COLOR,
    templates,
  };
}
