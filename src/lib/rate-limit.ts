import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Eenvoudige, database-gebaseerde rate limiter (geen Redis/externe
 * dependency nodig) voor publieke endpoints die geen Supabase Auth-aanroep
 * zijn en dus niet al onder Supabase's eigen Auth-rate-limits vallen.
 * Telt recente hits in `rate_limit_hits` (migratie 0011); die tabel wordt
 * opgeruimd door de dagelijkse cron.
 */
export async function checkRateLimit(
  bucket: string,
  identifier: string,
  { max, windowSeconds }: { max: number; windowSeconds: number },
): Promise<{ allowed: boolean }> {
  const supabase = createAdminClient();
  const since = new Date(Date.now() - windowSeconds * 1000).toISOString();

  const { count } = await supabase
    .from("rate_limit_hits")
    .select("id", { count: "exact", head: true })
    .eq("bucket", bucket)
    .eq("identifier", identifier)
    .gte("created_at", since);

  if ((count ?? 0) >= max) {
    return { allowed: false };
  }

  await supabase.from("rate_limit_hits").insert({ bucket, identifier });
  return { allowed: true };
}
