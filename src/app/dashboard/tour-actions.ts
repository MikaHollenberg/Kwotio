"use server";

import { createClient } from "@/lib/supabase/server";

/** Zet nadat de rondleiding gestart, doorlopen óf overgeslagen is -- stuurt
 * alleen de automatische eerste-keer-prompt aan; de rondleiding zelf blijft
 * daarna altijd herstartbaar via het los knopje in de topbar. */
export async function markTourSeen() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("profiles").update({ onboarding_tour_seen_at: new Date().toISOString() }).eq("id", user.id);
}
