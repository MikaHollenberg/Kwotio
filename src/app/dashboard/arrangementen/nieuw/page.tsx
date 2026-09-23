import { createClient } from "@/lib/supabase/server";
import { ArrangementForm } from "../arrangement-form";

export default async function NieuwArrangementPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user?.id ?? "")
    .single();

  return (
    <ArrangementForm
      mode="create"
      organizationId={profile?.organization_id ?? ""}
      initial={{
        name: "",
        description: "",
        category: "",
        colorCode: "#B87F2A",
        basePrice: 0,
        pricingMode: "vast",
        contentItems: [],
        pdfUrl: "",
      }}
      initialTiers={[]}
      initialSeasons={[]}
    />
  );
}
