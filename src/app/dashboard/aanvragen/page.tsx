import { createClient } from "@/lib/supabase/server";
import { AanvragenTable } from "./aanvragen-table";

export default async function AanvragenPage() {
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("quote_requests")
    .select("id, customer_name, customer_email, customer_phone, status, template_id, created_at")
    .order("created_at", { ascending: false });

  const templateIds = [...new Set((rows ?? []).map((r) => r.template_id).filter((id): id is string => !!id))];
  const { data: templates } =
    templateIds.length > 0
      ? await supabase.from("templates").select("id, name").in("id", templateIds)
      : { data: [] };
  const templateNameById = new Map((templates ?? []).map((t) => [t.id, t.name]));

  const requests = (rows ?? []).map((r) => ({
    ...r,
    templateName: r.template_id ? (templateNameById.get(r.template_id) ?? null) : null,
  }));

  return <AanvragenTable requests={requests} />;
}
