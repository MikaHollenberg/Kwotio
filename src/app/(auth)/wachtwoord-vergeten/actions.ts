"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

export type ForgotPasswordState = { message: string | null };

const GENERIC_MESSAGE =
  "Als dit e-mailadres bekend is, ontvang je een e-mail met instructies om je wachtwoord te herstellen.";

export async function requestPasswordReset(
  _prevState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { message: "Vul je e-mailadres in." };
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "onbekend";
  const { allowed } = await checkRateLimit("password_reset", ip, { max: 3, windowSeconds: 15 * 60 });
  if (!allowed) {
    return { message: "Te veel pogingen vanaf dit adres. Probeer het over een kwartier opnieuw." };
  }

  const start = Date.now();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const supabase = await createClient();

  // Het resultaat wordt bewust genegeerd: resetPasswordForEmail onthult zelf
  // al nooit of het e-mailadres bestaat (Supabase stuurt gewoon geen mail bij
  // een onbekend adres, maar geeft toch succes terug) — wij mogen dat
  // verschil niet alsnog introduceren via een afwijkend bericht.
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/wachtwoord-herstellen`,
  });

  // Defensieve tijdsvloer, zelfde principe als bij inloggen: sluit ook een
  // eventueel klein tijdsverschil tussen bestaand/niet-bestaand adres uit.
  const minDelayMs = 300;
  const elapsed = Date.now() - start;
  if (elapsed < minDelayMs) {
    await new Promise((resolve) => setTimeout(resolve, minDelayMs - elapsed));
  }

  return { message: GENERIC_MESSAGE };
}
