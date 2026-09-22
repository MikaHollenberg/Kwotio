import { createClient } from "@/lib/supabase/server";
import { isInvoicingEnabled } from "@/lib/invoicing/feature-flag";
import { FaqContent } from "./faq-content";

export default async function FaqPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, organization_id")
    .eq("id", user!.id)
    .single();
  const canManageOrg = profile?.role === "owner" || profile?.role === "admin";

  return <FaqContent canManageOrg={canManageOrg} invoicingEnabled={isInvoicingEnabled(profile?.organization_id)} />;
}
