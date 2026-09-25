import { createClient } from "@/lib/supabase/server";
import { ArrangementenList } from "./arrangementen-list";

export default async function ArrangementenPage() {
  const supabase = await createClient();
  const { data: arrangements } = await supabase
    .from("arrangements")
    .select("id, name, description, category, color_code, is_publicly_visible, sort_order, archived_at")
    .order("sort_order", { ascending: true });

  const ids = (arrangements ?? []).map((a) => a.id);
  const [{ data: prices }, { data: surcharges }] =
    ids.length > 0
      ? await Promise.all([
          supabase.from("arrangement_prices").select("arrangement_id, unit, amount").in("arrangement_id", ids),
          supabase.from("arrangement_surcharges").select("arrangement_id").in("arrangement_id", ids),
        ])
      : [{ data: [] }, { data: [] }];

  const rows = (arrangements ?? []).map((a) => {
    const ownPrices = (prices ?? []).filter((p) => p.arrangement_id === a.id);
    const ownSurcharges = (surcharges ?? []).filter((s) => s.arrangement_id === a.id);
    const cheapest = ownPrices.reduce<{ unit: string; amount: number } | null>(
      (min, p) => (min === null || Number(p.amount) < min.amount ? { unit: p.unit, amount: Number(p.amount) } : min),
      null,
    );
    return {
      id: a.id,
      name: a.name,
      description: a.description,
      category: a.category,
      color_code: a.color_code,
      is_publicly_visible: a.is_publicly_visible,
      sort_order: a.sort_order,
      archived_at: a.archived_at,
      startingPrice: cheapest?.amount ?? null,
      pricePerPerson: cheapest?.unit === "p.p.",
      isVariable: ownPrices.length > 1 || ownSurcharges.length > 0,
    };
  });

  return <ArrangementenList arrangements={rows} />;
}
