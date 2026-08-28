"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

export type AuthActionState = { error: string | null };

export async function signIn(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");

  if (!email || !password) {
    return { error: "Vul je e-mailadres en wachtwoord in." };
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "onbekend";
  const { allowed } = await checkRateLimit("login", ip, { max: 5, windowSeconds: 15 * 60 });
  if (!allowed) {
    return { error: "Te veel inlogpogingen. Probeer het over een kwartier opnieuw." };
  }

  const start = Date.now();
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Een bestaand account met fout wachtwoord kost Supabase aantoonbaar
    // meer tijd (echte bcrypt-check) dan een onbekend e-mailadres (~140ms
    // vs ~40ms gemeten) — dat tijdsverschil verraadt welke e-mailadressen
    // een account hebben, ook al is de foutmelding identiek. Vaste
    // minimumtijd voorkomt dat lek.
    const minDelayMs = 300;
    const elapsed = Date.now() - start;
    if (elapsed < minDelayMs) {
      await new Promise((resolve) => setTimeout(resolve, minDelayMs - elapsed));
    }
    return { error: "E-mailadres of wachtwoord is onjuist." };
  }

  redirect(next.startsWith("/") ? next : "/dashboard");
}
