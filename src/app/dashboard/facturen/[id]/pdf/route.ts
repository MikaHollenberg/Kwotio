import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderInvoicePdf } from "@/lib/invoice-pdf/invoice-document";
import { buildInvoicePdfData } from "@/lib/invoice-pdf/build-invoice-pdf-data";
import { isInvoicingEnabled } from "@/lib/invoicing/feature-flag";

/**
 * Geauthenticeerde route (normale RLS-client, geen publieke share-token-
 * variant -- er is geen klant-facing factuurportaal in deze fase). Geen
 * layout.tsx-bescherming hier (route handlers vallen daarbuiten), dus de
 * facturenmodule-check staat hier expliciet.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single();
  if (!isInvoicingEnabled(profile?.organization_id)) {
    return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
  }

  const origin = new URL(request.url).origin;
  const data = await buildInvoicePdfData(supabase, id, origin);
  if (!data) return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });

  const pdf = await renderInvoicePdf(data);
  const safeNumber = data.invoiceNumber.replace(/[^a-z0-9]+/gi, "-").toLowerCase();

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="factuur-${safeNumber}.pdf"`,
    },
  });
}
