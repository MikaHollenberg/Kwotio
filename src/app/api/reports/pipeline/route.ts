import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDashboardKpis, getPipeline } from "@/lib/stats/queries";
import { renderPipelineReportPdf } from "@/lib/reports/pipeline-report";
import type { QuoteStatus } from "@/lib/types/database";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();
  if (!profile) return NextResponse.json({ error: "Geen organisatie" }, { status: 400 });

  const { data: organization } = await supabase
    .from("organizations")
    .select("brand_name")
    .eq("id", profile.organization_id)
    .single();

  const [kpis, pipeline] = await Promise.all([
    getDashboardKpis(supabase, profile.organization_id),
    getPipeline(supabase, profile.organization_id),
  ]);

  const pipelineCounts = Object.fromEntries(
    (Object.entries(pipeline) as [QuoteStatus, (typeof pipeline)[QuoteStatus]][]).map(([status, quotes]) => [
      status,
      { count: quotes.length, value: quotes.reduce((sum, q) => sum + q.total, 0) },
    ]),
  ) as Record<QuoteStatus, { count: number; value: number }>;

  const pdf = await renderPipelineReportPdf({
    organizationName: organization?.brand_name ?? "Feest aan het Water",
    kpis,
    pipelineCounts,
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="pipeline-rapportage-${new Date().toISOString().slice(0, 10)}.pdf"`,
    },
  });
}
