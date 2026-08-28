import { createClient } from "@/lib/supabase/server";
import { NieuweOfferteForm } from "./nieuwe-offerte-form";

export default async function NieuweOffertePage() {
  const supabase = await createClient();
  const { data: templates } = await supabase
    .from("templates")
    .select("id, name, event_type")
    .eq("is_active", true)
    .order("name", { ascending: true });

  return <NieuweOfferteForm templates={templates ?? []} />;
}
