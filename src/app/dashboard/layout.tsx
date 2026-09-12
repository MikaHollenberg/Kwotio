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
    .select("full_name, email, role, is_super_admin, organization_id, onboarding_tour_seen_at")
    .eq("id", user.id)
    .single();
  const canManageOrg = profile?.role === "owner" || profile?.role === "admin";

  const [{ data: organization }, { count: newRequestCount }] = await Promise.all([
    profile
      ? supabase
          .from("organizations")
          .select("logo_horizontal_url, brand_name, terms_url")
          .eq("id", profile.organization_id)
          .single()
      : Promise.resolve({ data: null }),
    profile
      ? supabase
          .from("quote_requests")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", profile.organization_id)
          .eq("status", "nieuw")
      : Promise.resolve({ count: 0 }),
  ]);

  return (
    <div className="flex min-h-screen bg-sand-100">
      <Sidebar
        showAdmin={profile?.is_super_admin ?? false}
        canManageOrg={canManageOrg}
        logoUrl={organization?.logo_horizontal_url}
        organizationName={organization?.brand_name}
        newRequestCount={newRequestCount ?? 0}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardShell
          fullName={profile?.full_name ?? null}
          email={profile?.email ?? user.email ?? ""}
          showAdmin={profile?.is_super_admin ?? false}
          canManageOrg={canManageOrg}
          organizationName={organization?.brand_name ?? null}
          termsUrl={organization?.terms_url ?? null}
          newRequestCount={newRequestCount ?? 0}
          tourSeen={Boolean(profile?.onboarding_tour_seen_at)}
        >
          {children}
        </DashboardShell>
      </div>
    </div>
  );
}
