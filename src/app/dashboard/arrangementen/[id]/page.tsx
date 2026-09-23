import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrangementForm } from "../arrangement-form";

export default async function ArrangementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: arrangement }, { data: tiers }, { data: seasons }, { data: availability }] = await Promise.all([
    supabase
      .from("arrangements")
      .select(
        "id, name, description, category, color_code, base_price, pricing_mode, archived_at, inclusief_sections, highlight_title, highlight_text, extras",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("arrangement_price_tiers")
      .select("min_guests, max_guests, price")
      .eq("arrangement_id", id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("arrangement_season_prices")
      .select("label, start_date, end_date, price")
      .eq("arrangement_id", id)
      .order("sort_order", { ascending: true }),
    supabase.from("arrangement_availability").select("date, status").eq("arrangement_id", id),
  ]);

  if (!arrangement) notFound();

  return (
    <ArrangementForm
      mode="edit"
      arrangementId={arrangement.id}
      archivedAt={arrangement.archived_at}
      initial={{
        name: arrangement.name,
        description: arrangement.description,
        category: arrangement.category,
        colorCode: arrangement.color_code,
        basePrice: Number(arrangement.base_price),
        pricingMode: arrangement.pricing_mode,
        inclusiefSections: arrangement.inclusief_sections,
        highlightTitle: arrangement.highlight_title ?? "",
        highlightText: arrangement.highlight_text ?? "",
        extras: arrangement.extras,
      }}
      initialTiers={(tiers ?? []).map((t) => ({ minGuests: t.min_guests, maxGuests: t.max_guests, price: Number(t.price) }))}
      initialSeasons={(seasons ?? []).map((s) => ({ label: s.label, startDate: s.start_date, endDate: s.end_date, price: Number(s.price) }))}
      initialAvailability={availability ?? []}
    />
  );
}
