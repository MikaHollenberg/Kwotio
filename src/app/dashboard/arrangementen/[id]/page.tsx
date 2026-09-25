import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrangementForm } from "../arrangement-form";

export default async function ArrangementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: arrangement }, { data: prices }, { data: seasons }, { data: seasonPrices }, { data: surcharges }] =
    await Promise.all([
      supabase
        .from("arrangements")
        .select(
          "id, organization_id, name, description, public_description, category, color_code, price_display, is_publicly_visible, archived_at, content_items, pdf_url",
        )
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("arrangement_prices")
        .select("id, label, unit, amount")
        .eq("arrangement_id", id)
        .is("season_id", null)
        .order("sort_order", { ascending: true }),
      supabase
        .from("arrangement_seasons")
        .select("id, label, start_date, end_date")
        .eq("arrangement_id", id)
        .order("sort_order", { ascending: true }),
      supabase
        .from("arrangement_prices")
        .select("id, season_id, label, unit, amount")
        .eq("arrangement_id", id)
        .not("season_id", "is", null)
        .order("sort_order", { ascending: true }),
      supabase
        .from("arrangement_surcharges")
        .select("id, label, min_guests, max_guests, unit, amount")
        .eq("arrangement_id", id)
        .order("sort_order", { ascending: true }),
    ]);

  if (!arrangement) notFound();

  return (
    <ArrangementForm
      mode="edit"
      arrangementId={arrangement.id}
      organizationId={arrangement.organization_id}
      archivedAt={arrangement.archived_at}
      initial={{
        name: arrangement.name,
        description: arrangement.description,
        publicDescription: arrangement.public_description,
        category: arrangement.category,
        colorCode: arrangement.color_code,
        priceDisplay: arrangement.price_display,
        isPubliclyVisible: arrangement.is_publicly_visible,
        contentItems: arrangement.content_items,
        pdfUrl: arrangement.pdf_url ?? "",
      }}
      initialPrices={(prices ?? []).map((p) => ({ id: p.id, label: p.label, unit: p.unit, amount: Number(p.amount) }))}
      initialSeasons={(seasons ?? []).map((s) => ({
        id: s.id,
        label: s.label,
        startDate: s.start_date,
        endDate: s.end_date,
        prices: (seasonPrices ?? [])
          .filter((p) => p.season_id === s.id)
          .map((p) => ({ id: p.id, label: p.label, unit: p.unit, amount: Number(p.amount) })),
      }))}
      initialSurcharges={(surcharges ?? []).map((s) => ({
        id: s.id,
        label: s.label,
        minGuests: s.min_guests,
        maxGuests: s.max_guests,
        unit: s.unit,
        amount: Number(s.amount),
      }))}
    />
  );
}
