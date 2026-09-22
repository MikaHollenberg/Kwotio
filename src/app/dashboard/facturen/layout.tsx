import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isInvoicingEnabled } from "@/lib/invoicing/feature-flag";

/**
 * Eén centrale toegangscheck voor alle /dashboard/facturen/*-pagina's — de
 * module is tijdelijk gepauzeerd voor echte organisaties (zie feature-flag.ts).
 * Blokkeert ook directe URL-navigatie, niet alleen het verborgen menu-item.
 * Geldt niet voor route handlers (bv. [id]/pdf/route.ts) — die hebben hun
 * eigen check nodig, Next.js past layouts alleen op page.tsx's toe.
 */
export default async function FacturenLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single();
  if (!isInvoicingEnabled(profile?.organization_id)) redirect("/dashboard");

  return <>{children}</>;
}
