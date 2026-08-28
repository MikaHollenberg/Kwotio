import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

/**
 * Service-role client — omzeilt Row Level Security. Uitsluitend gebruiken in
 * server-only code (route handlers, server actions) voor taken die niet aan
 * een ingelogde bureau-gebruiker gebonden zijn, zoals de publieke
 * klantportaal-RPC's (Fase 3) en PDF/e-mail-generatie (Fase 4).
 * Nooit importeren in Client Components.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
