import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrangementForm } from "../arrangement-form";

export default async function ArrangementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: arrangement }, { data: tiers }, { data: seasons }] = await Promise.all([
    supabase
      .from("arrangements")
      .select(
        "id, organization_id, name, description, category, color_code, base_price, pricing_mode, price_per_person, price_display, is_publicly_visible, archived_at, content_items, pdf_url",
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
        category: arrangement.category,
        colorCode: arrangement.color_code,
        basePrice: Number(arrangement.base_price),
        pricingMode: arrangement.pricing_mode,
        pricePerPerson: arrangement.price_per_person,
        priceDisplay: arrangement.price_display,
        isPubliclyVisible: arrangement.is_publicly_visible,
        contentItems: arrangement.content_items,
        pdfUrl: arrangement.pdf_url ?? "",
      }}
      initialTiers={(tiers ?? []).map((t) => ({ minGuests: t.min_guests, maxGuests: t.max_guests, price: Number(t.price) }))}
      initialSeasons={(seasons ?? []).map((s) => ({ label: s.label, startDate: s.start_date, endDate: s.end_date, price: Number(s.price) }))}
    />
  );
}
