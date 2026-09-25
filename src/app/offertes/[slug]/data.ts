import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadTemplateBlocks } from "@/lib/blocks/persistence";
import { resolvePreferredLogo } from "@/lib/organization/logo";
import { resolveAccentColor } from "@/lib/organization/theme";
import { calculateStartingPrice } from "@/lib/arrangements/pricing";
import type { BlockDraft } from "@/lib/blocks/types";
import type { PublicPageBackgroundStyle, PriceDisplayMode } from "@/lib/types/database";

export type PublicOrgTemplate = {
  id: string;
  name: string;
  description: string | null;
  blocks: BlockDraft[];
};

/** Eén publiek zichtbaar arrangement, kant-en-klaar als offerteblok zodat de
 * publieke pagina 'm rechtstreeks door BlockPreview kan laten renderen --
 * zelfde momentopname-vorm als newBlockFromArrangement() voor een echte
 * offerte bouwt. De prijs wordt hier berekend zonder specifieke datum (een
 * bezoeker bekijkt het aanbod, boekt nog niets): `basePrice` is de laagst
 * mogelijke ("vanaf") prijs over alle prijsregels/seizoenen heen, zie
 * calculateStartingPrice(). */
export type PublicOrgArrangement = {
  id: string;
  name: string;
  description: string | null;
  colorCode: string | null;
  /** Meer dan één prijsregel of een seizoen -- de kaart toont dan "Vanaf". */
  isVariable: boolean;
  basePrice: number | null;
  pricePerPerson: boolean;
  priceDisplay: PriceDisplayMode;
  block: BlockDraft;
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
  /** Publiek zichtbare arrangementen (arrangements.is_publicly_visible =
   * true voor deze organisatie), los van de templates hierboven, zie
   * migratie 0077. */
  arrangements: PublicOrgArrangement[];
  /** ISO-datums (YYYY-MM-DD) waarop de organisatie gesloten is -- de klant
   * kan deze niet kiezen als gewenste datum. Alleen toekomstige datums,
   * begrensd op 2 jaar vooruit (een organisatie zet dit doorgaans maar een
   * beperkt aantal maanden vooruit). */
  closedDates: string[];
  /** organizations.closed_weekdays -- 0 = zondag .. 6 = zaterdag, een vaste
   * wekelijkse sluitingsdag naast de losse datums hierboven. */
  closedWeekdays: number[];
  /** organizations.public_page_background_style -- per organisatie te
   * kiezen decoratieve achtergrondstijl (zie Instellingen → Organisatie →
   * "Publieke offertepagina"). Standaard "none". */
  backgroundStyle: PublicPageBackgroundStyle;
  /** organizations.location_photo_url -- geen foto ingesteld = geen
   * locatiesectie op de pagina (bewust geen aparte aan/uit-toggle nodig). */
  locationPhotoUrl: string | null;
  locationCaption: string | null;
  /** Voorgeformatteerd adres ("Straat 1, 1234 AB Plaats") uit
   * organizations.address, of null als er geen straat/plaats is ingevuld. */
  locationAddress: string | null;
};

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
      "id, brand_name, logo_horizontal_url, logo_square_url, logo_preference, terms_url, public_welcome_message, guest_count_field_active, guest_count_field_label, brand_theme, closed_weekdays, archived_at, public_page_background_style, location_photo_url, location_caption, address",
    )
    .eq("public_slug", slug)
    .maybeSingle();
  if (orgError) throw orgError;
  if (!organization || organization.archived_at) return null;

  const { data: templateRows, error: templateError } = await supabase
    .from("templates")
    .select("id, name, description")
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
      blocks: await loadTemplateBlocks(supabase, t.id),
    })),
  );

  const { data: arrangementRows, error: arrangementError } = await supabase
    .from("arrangements")
    .select("id, name, description, public_description, color_code, price_display, content_items, pdf_url")
    .eq("organization_id", organization.id)
    .eq("is_publicly_visible", true)
    .is("archived_at", null)
    .order("sort_order", { ascending: true });
  if (arrangementError) throw arrangementError;

  // Prijzen/seizoenen van alle publiek zichtbare arrangementen in één keer
  // ophalen (niet per arrangement een losse query) -- zodat een variabel
  // geprijsd arrangement hieronder ook echt de laagste ("vanaf") prijs kan
  // tonen i.p.v. altijd hetzelfde platte bedrag.
  const arrangementIds = (arrangementRows ?? []).map((a) => a.id);
  const [{ data: priceRows }, { data: seasonRows }, { data: surchargeRows }] =
    arrangementIds.length > 0
      ? await Promise.all([
          supabase
            .from("arrangement_prices")
            .select("arrangement_id, season_id, label, unit, amount")
            .in("arrangement_id", arrangementIds),
          supabase.from("arrangement_seasons").select("id, arrangement_id, label, start_date, end_date").in("arrangement_id", arrangementIds),
          supabase
            .from("arrangement_surcharges")
            .select("arrangement_id, label, min_guests, max_guests, unit, amount")
            .in("arrangement_id", arrangementIds),
        ])
      : [{ data: [] }, { data: [] }, { data: [] }];

  const arrangements: PublicOrgArrangement[] = (arrangementRows ?? []).map((a) => {
    const ownPrices = (priceRows ?? [])
      .filter((p) => p.arrangement_id === a.id && p.season_id === null)
      .map((p) => ({ id: `${a.id}-${p.label}`, label: p.label, unit: p.unit, amount: Number(p.amount) }));
    const ownSeasons = (seasonRows ?? [])
      .filter((s) => s.arrangement_id === a.id)
      .map((s) => ({
        id: s.id,
        label: s.label,
        startDate: s.start_date,
        endDate: s.end_date,
        prices: (priceRows ?? [])
          .filter((p) => p.season_id === s.id)
          .map((p) => ({ id: `${s.id}-${p.label}`, label: p.label, unit: p.unit, amount: Number(p.amount) })),
      }));
    const startingPrice = calculateStartingPrice(ownPrices, ownSeasons);
    const cheapest = [...ownPrices, ...ownSeasons.flatMap((s) => s.prices)].reduce<{ unit: string } | null>(
      (min, p) => (min === null || p.amount === startingPrice ? p : min),
      null,
    );
    return {
      id: a.id,
      name: a.name,
      // De losse publieke tekst (public_description) is bedoeld voor de
      // compacte kaart op DEZE pagina -- het blok.content.description
      // hieronder blijft altijd de "echte" omschrijving (ook zichtbaar
      // zodra iemand de kaart openklapt), zie migratie 0078.
      description: a.public_description.trim() || a.description,
      colorCode: a.color_code,
      isVariable:
        ownPrices.length > 1 || ownSeasons.length > 0 || (surchargeRows ?? []).some((s) => s.arrangement_id === a.id),
      basePrice: startingPrice,
      pricePerPerson: cheapest?.unit === "p.p.",
      priceDisplay: a.price_display,
      block: {
        id: a.id,
        type: "arrangement",
        position: 0,
        content: {
          heading: a.name,
          arrangementId: a.id,
          name: a.name,
          description: a.description,
          colorCode: a.color_code,
          prices: ownPrices,
          seasonLabel: null,
          surcharges: (surchargeRows ?? [])
            .filter((s) => s.arrangement_id === a.id)
            .map((s) => ({ id: `${a.id}-${s.min_guests}`, label: s.label, minGuests: s.min_guests, maxGuests: s.max_guests, unit: s.unit, amount: Number(s.amount) })),
          priceDisplay: a.price_display,
          contentItems: a.content_items,
          pdfUrl: a.pdf_url,
        },
      },
    };
  });

  const todayKey = new Date().toISOString().slice(0, 10);
  const twoYearsOut = new Date();
  twoYearsOut.setFullYear(twoYearsOut.getFullYear() + 2);
  const { data: closedDateRows } = await supabase
    .from("closed_dates")
    .select("date")
    .eq("organization_id", organization.id)
    .gte("date", todayKey)
    .lte("date", twoYearsOut.toISOString().slice(0, 10));

  return {
    organizationId: organization.id,
    organizationName: organization.brand_name,
    logoUrl: resolvePreferredLogo(organization),
    termsUrl: organization.terms_url,
    welcomeMessage: organization.public_welcome_message,
    guestCountFieldActive: organization.guest_count_field_active,
    guestCountFieldLabel: organization.guest_count_field_label || "Aantal personen",
    primaryColor: resolveAccentColor(organization),
    templates,
    arrangements,
    closedDates: (closedDateRows ?? []).map((r) => r.date),
    closedWeekdays: organization.closed_weekdays ?? [],
    backgroundStyle: organization.public_page_background_style ?? "none",
    locationPhotoUrl: organization.location_photo_url,
    locationCaption: organization.location_caption,
    locationAddress: formatAddress(organization.address as { street?: string; postalCode?: string; city?: string } | null),
  };
}

function formatAddress(address: { street?: string; postalCode?: string; city?: string } | null): string | null {
  const street = address?.street?.trim();
  const cityLine = [address?.postalCode?.trim(), address?.city?.trim()].filter(Boolean).join(" ");
  const parts = [street, cityLine].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}
