import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/dashboard/sidebar";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, is_super_admin, organization_id")
    .eq("id", user.id)
    .single();

  const { data: organization } = profile
    ? await supabase
        .from("organizations")
        .select("logo_horizontal_url")
        .eq("id", profile.organization_id)
        .single()
    : { data: null };

  return (
    <div className="flex min-h-screen bg-sand-100">
      <Sidebar showAdmin={profile?.is_super_admin ?? false} logoUrl={organization?.logo_horizontal_url} />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardShell
          fullName={profile?.full_name ?? null}
          email={profile?.email ?? user.email ?? ""}
          showAdmin={profile?.is_super_admin ?? false}
        >
          {children}
        </DashboardShell>
      </div>
    </div>
  );
}
