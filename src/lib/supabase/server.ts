import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/types/database";

/**
 * Server-side Supabase client voor Server Components, Server Actions en Route
 * Handlers. Leest/schrijft de auth-sessie via Next.js cookies().
 *
 * `setAll` faalt stil wanneer aangeroepen vanuit een Server Component (cookies
 * zijn daar read-only) — de sessie wordt dan alsnog ververst via proxy.ts.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component context — proxy.ts ververst de sessie i.p.v. hier.
          }
        },
      },
    },
  );
}
