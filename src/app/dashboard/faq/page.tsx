import { createClient } from "@/lib/supabase/server";
import { FaqContent } from "./faq-content";

export default async function FaqPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  const canManageOrg = profile?.role === "owner" || profile?.role === "admin";

  return <FaqContent canManageOrg={canManageOrg} />;
}
