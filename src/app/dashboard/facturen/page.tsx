import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { FacturenTabs } from "./facturen-tabs";
import { InvoicesTable } from "./invoices-table";

export default async function FacturenPage() {
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
  const canCreate = profile.role !== "readonly";
  const canManage = profile.role === "owner" || profile.role === "admin";

  const [{ data: invoices }, { data: slotfactuurLinks }] = await Promise.all([
    supabase
      .from("invoices")
      .select("id, invoice_number, type, status, client_name, total_incl_vat, invoice_date, due_date, paid_at")
      .order("created_at", { ascending: false }),
    supabase.from("invoices").select("deposit_invoice_id").eq("type", "slotfactuur").not("deposit_invoice_id", "is", null),
  ]);

  // Voor de "Wacht op slotfactuur"-filter: een betaalde aanbetaling zonder
  // al gekoppelde slotfactuur.
  const invoicesWithSlotfactuur = new Set((slotfactuurLinks ?? []).map((l) => l.deposit_invoice_id));
  const invoiceRows = (invoices ?? []).map((invoice) => ({
    ...invoice,
    awaitingSlotfactuur: invoice.type === "aanbetaling" && invoice.status === "betaald" && !invoicesWithSlotfactuur.has(invoice.id),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink-500">Facturen</h1>
          <p className="text-sm text-ink-400">
            Facturen vanuit een offerte of los aangemaakt, incl. aanbetalingen en slotfacturen.
          </p>
        </div>
        {canCreate && (
          <ButtonLink href="/dashboard/facturen/nieuw" variant="primary" size="sm" data-faq-id="new-invoice-button">
            <Plus className="mr-1.5 size-4" />
            Nieuwe factuur
          </ButtonLink>
        )}
      </div>

      <div data-faq-id="facturen-tabs">
        <FacturenTabs active="facturen" />
      </div>

      <Card data-faq-id="facturen-list">
        <CardHeader>
          <CardTitle>Alle facturen</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoicesTable invoices={invoiceRows} canManage={canManage} />
        </CardContent>
      </Card>
    </div>
  );
}
