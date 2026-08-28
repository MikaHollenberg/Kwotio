import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data: quote } = await supabase
    .from("quotes")
    .select("id, title")
    .eq("share_token", token)
    .maybeSingle();
  if (!quote) return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });

  const { data: signature } = await supabase
    .from("signatures")
    .select("certificate_pdf_url")
    .eq("quote_id", quote.id)
    .order("signed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!signature?.certificate_pdf_url) {
    return NextResponse.json({ error: "Nog geen certificaat beschikbaar" }, { status: 404 });
  }

  const { data: file, error } = await supabase.storage
    .from("quote-documents")
    .download(signature.certificate_pdf_url);
  if (error || !file) return NextResponse.json({ error: "Kon bestand niet ophalen" }, { status: 500 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const safeTitle = quote.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="certificaat-${safeTitle}.pdf"`,
    },
  });
}
