import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { CatalogItemOption } from "@/components/invoicing/line-items-editor";
import { NieuweFactuurForm } from "./nieuwe-factuur-form";

export default async function NieuweFactuurPage() {
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
  if (profile.role === "readonly") redirect("/dashboard/facturen");

  const [{ data: organization }, { data: catalogItemRows }] = await Promise.all([
    supabase
      .from("organizations")
      .select("invoice_vat_rate_high, invoice_vat_rate_low")
      .eq("id", profile.organization_id)
      .maybeSingle(),
    supabase
      .from("invoice_catalog_items")
      .select("id, name, description, unit_price, vat_rate_type, vat_rate_custom")
      .is("archived_at", null)
      .order("name", { ascending: true }),
  ]);

  const catalogItems: CatalogItemOption[] = (catalogItemRows ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    unitPrice: Number(c.unit_price),
    vatRateType: c.vat_rate_type,
    vatRateCustom: c.vat_rate_custom != null ? Number(c.vat_rate_custom) : null,
  }));

  return (
    <NieuweFactuurForm
      vatRates={{ hoog: organization?.invoice_vat_rate_high ?? 21, laag: organization?.invoice_vat_rate_low ?? 9 }}
      catalogItems={catalogItems}
    />
  );
}
