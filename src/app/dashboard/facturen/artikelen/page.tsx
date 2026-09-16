import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FacturenTabs } from "../facturen-tabs";
import { CatalogItemsTable } from "./catalog-items-table";

export default async function FactuurArtikelenPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .eq("id", user!.id)
    .single();
  if (!profile) redirect("/dashboard");

  const { data: items } = await supabase
    .from("invoice_catalog_items")
    .select("id, name, description, unit_price, vat_rate_type, vat_rate_custom, archived_at")
    .order("name", { ascending: true });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-500">Facturen</h1>
        <p className="text-sm text-ink-400">Veelgebruikte factuurregels beheren.</p>
      </div>
      <FacturenTabs active="artikelen" />
      <CatalogItemsTable items={items ?? []} canEdit={profile.role !== "readonly"} />
    </div>
  );
}
