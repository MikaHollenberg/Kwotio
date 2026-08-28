import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Server-side super-admin-check — nooit alleen UI verbergen. Redirect i.p.v.
 * throwen, zodat een niet-super-admin die /admin of een admin-route/action
 * rechtstreeks aanroept altijd terugvalt op het gewone dashboard.
 */
export async function requireSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_super_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_super_admin) redirect("/dashboard");

  return { userId: user.id };
}
