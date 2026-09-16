import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMollieClient } from "@/lib/invoicing/mollie";

/**
 * Mollie stuurt geen auth-header mee -- de beveiliging zit 'm erin dat we
 * de meegestuurde `id` altijd EERST opnieuw opzoeken bij Mollie zelf (met
 * de sleutel van de organisatie die deze specifieke betaling aanmaakte),
 * en nooit een statusveld uit de webhook-payload zelf vertrouwen. Zonder
 * ingelogde sessie, dus service-role (`createAdminClient()`).
 */
export async function POST(request: Request) {
  const body = await request.formData().catch(() => null);
  const paymentId = body?.get("id")?.toString();
  if (!paymentId) return NextResponse.json({ error: "Geen payment id" }, { status: 400 });

  const supabase = createAdminClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, organization_id, type, quote_id, total_incl_vat")
    .eq("mollie_payment_id", paymentId)
    .maybeSingle();
  // Onbekende/verlopen betaling -- niets aan deze kant te doen, wel 200
  // teruggeven zodat Mollie het niet blijft herhalen.
  if (!invoice) return NextResponse.json({ ok: true });

  const { data: organization } = await supabase
    .from("organizations")
    .select("mollie_api_key")
    .eq("id", invoice.organization_id)
    .maybeSingle();
  if (!organization?.mollie_api_key) return NextResponse.json({ ok: true });

  const mollie = getMollieClient(organization.mollie_api_key);
  const payment = await mollie.payments.get(paymentId);

  await supabase.from("invoices").update({ mollie_payment_status: payment.status }).eq("id", invoice.id);

  if (payment.status === "paid") {
    const paidAt = payment.paidAt ?? new Date().toISOString();

    await supabase
      .from("invoices")
      .update({ status: "betaald", payment_method: "mollie", paid_at: paidAt })
      .eq("id", invoice.id);

    // Alleen bij een offerte-gebonden aanbetaling -- een losse factuur heeft
    // geen quotes-rij om de "aanbetaald"-cache op bij te werken.
    if (invoice.type === "aanbetaling" && invoice.quote_id) {
      await supabase
        .from("quotes")
        .update({ deposit_invoice_id: invoice.id, deposit_amount: invoice.total_incl_vat, deposit_paid_at: paidAt })
        .eq("id", invoice.quote_id);
    }
  }

  return NextResponse.json({ ok: true });
}
