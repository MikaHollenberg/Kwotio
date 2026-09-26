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

  // Populairste arrangement deze maand: hoe vaak het aan een offerte is
  // toegevoegd (arrangement-blokken deze maand, geteld in JS -- zelfde
  // aanpak als de bestaande "populairste pakket"-statistiek, waar
  // aggregeren op naam/id ook al gewoon client-side gebeurt i.p.v. via een
  // aparte SQL-group-by). Minimaal 2 keer nodig om als "populair" te tellen,
  // anders zou de eerste toevoeging deze maand het altijd al winnen.
  let mostAddedId: string | null = null;
  if (ids.length > 0) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user?.id ?? "")
      .single();
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: orgQuotes } = await supabase
      .from("quotes")
      .select("id")
      .eq("organization_id", profile?.organization_id ?? "");
    const quoteIds = (orgQuotes ?? []).map((q) => q.id);

    if (quoteIds.length > 0) {
      const { data: arrangementBlocks } = await supabase
        .from("quote_blocks")
        .select("content")
        .eq("type", "arrangement")
        .in("quote_id", quoteIds)
        .gte("created_at", startOfMonth.toISOString());

      const counts = new Map<string, number>();
      for (const block of arrangementBlocks ?? []) {
        const arrangementId = (block.content as { arrangementId?: string })?.arrangementId;
        if (!arrangementId) continue;
        counts.set(arrangementId, (counts.get(arrangementId) ?? 0) + 1);
      }
      let maxCount = 1;
      for (const [id, count] of counts) {
        if (count > maxCount) {
          maxCount = count;
          mostAddedId = id;
        }
      }
    }
  }

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
      isPopular: a.id === mostAddedId,
      sort_order: a.sort_order,
      archived_at: a.archived_at,
      startingPrice: cheapest?.amount ?? null,
      pricePerPerson: cheapest?.unit === "p.p.",
      isVariable: ownPrices.length > 1 || ownSurcharges.length > 0,
    };
  });

  return <ArrangementenList arrangements={rows} />;
}
