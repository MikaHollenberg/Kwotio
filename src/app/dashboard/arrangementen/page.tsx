import { createClient } from "@/lib/supabase/server";
import { ArrangementenList } from "./arrangementen-list";

export default async function ArrangementenPage() {
  const supabase = await createClient();
  const { data: arrangements } = await supabase
    .from("arrangements")
    .select("id, name, description, category, color_code, base_price, pricing_mode, sort_order, archived_at")
    .order("sort_order", { ascending: true });

  return <ArrangementenList arrangements={arrangements ?? []} />;
}
