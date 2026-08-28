"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type UpdatePasswordState = { error: string | null };

// Klein, gericht blocklistje van overduidelijk zwakke wachtwoorden — geen
// zware toevoeging, wel een zinvolle extra drempel bovenop de lengte-eis.
const WEAK_PASSWORDS = new Set([
  "wachtwoord",
  "wachtwoord1",
  "wachtwoord123",
  "password",
  "password1",
  "password123",
  "12345678",
  "123456789",
  "1234567890",
  "qwertyuiop",
  "letmein123",
  "welkom123",
  "00000000",
  "iloveyou",
]);

export async function updatePassword(
  _prevState: UpdatePasswordState,
  formData: FormData,
): Promise<UpdatePasswordState> {
  const password = String(formData.get("password") ?? "");
  const passwordRepeat = String(formData.get("passwordRepeat") ?? "");

  if (password.length < 8) {
    return { error: "Wachtwoord moet minimaal 8 tekens lang zijn." };
  }
  if (WEAK_PASSWORDS.has(password.toLowerCase())) {
    return { error: "Dit wachtwoord is te makkelijk te raden, kies iets unieks." };
  }
  if (password !== passwordRepeat) {
    return { error: "De wachtwoorden komen niet overeen." };
  }

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return { error: "Deze link is verlopen. Vraag een nieuwe aan via 'Wachtwoord vergeten'." };
  }

  const { error: updateError } = await supabase.auth.updateUser({ password });
  if (updateError) {
    return { error: "Kon het wachtwoord niet wijzigen. Probeer het opnieuw." };
  }

  // Hard afsluiten: na een wachtwoordwijziging moeten ALLE sessies van dit
  // account ongeldig worden — ook een eventueel elders gestolen sessie, en
  // ook de hersteldsessie die net gebruikt is. De gebruiker moet met het
  // nieuwe wachtwoord opnieuw inloggen.
  await supabase.auth.signOut();
  const admin = createAdminClient();
  await admin.auth.admin.signOut(session.access_token, "global");

  redirect("/login?wachtwoord_gewijzigd=1");
}
