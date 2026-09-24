import { createClient } from "@/lib/supabase/server";
import { LeadsTable } from "./leads-table";

export default async function LeadsPage() {
  const supabase = await createClient();

  const { data: leads } = await supabase
    .from("leads")
    .select(
      "id, name, company_name, email, phone, purpose, guest_count, preferred_date, message, status, converted_request_id, created_at",
    )
    .order("created_at", { ascending: false });

  return <LeadsTable leads={leads ?? []} />;
}
