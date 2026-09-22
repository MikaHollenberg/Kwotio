"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ADMIN_RETURN_SESSION_COOKIE,
  TEST_ORGANIZATION_ID,
  TEST_ORGANIZATION_LOGIN_EMAIL,
} from "@/lib/admin/testomgeving";

/**
 * Wisselt de actieve sessie naar een echte, volwaardige sessie van de
 * testorganisatie — geen aparte login, geen RLS-omweg: dit is een echte
 * Supabase-sessie van het bestaande testaccount, dus alle bestaande
 * beveiliging (RLS, current_organization_id()) werkt precies zoals bij elk
 * ander account. De huidige (super-admin-)sessie wordt eerst weggeschreven
 * in een korte-levensduur HttpOnly-cookie, zodat "Terug naar hoofdaccount"
 * 'm zonder opnieuw inloggen kan herstellen.
 */
export async function enterTestomgeving() {
  await requireSuperAdmin();

  const supabase = await createClient();
  const {
    data: { session: currentSession },
  } = await supabase.auth.getSession();
  if (!currentSession) redirect("/login");

  const cookieStore = await cookies();
  cookieStore.set(
    ADMIN_RETURN_SESSION_COOKIE,
    JSON.stringify({
      access_token: currentSession.access_token,
      refresh_token: currentSession.refresh_token,
    }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    },
  );

  const admin = createAdminClient();
  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: TEST_ORGANIZATION_LOGIN_EMAIL,
  });
  if (linkError || !link?.properties?.hashed_token) {
    cookieStore.delete(ADMIN_RETURN_SESSION_COOKIE);
    throw linkError ?? new Error("Kon geen sessie voor de testomgeving aanmaken.");
  }

  const { error: verifyError } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: link.properties.hashed_token,
  });
  if (verifyError) {
    cookieStore.delete(ADMIN_RETURN_SESSION_COOKIE);
    throw verifyError;
  }

  redirect("/dashboard");
}

/**
 * Herstelt de oorspronkelijke sessie vanuit de bewaarde cookie. Draait
 * doelbewust GEEN `requireSuperAdmin()` — de actieve sessie op dit moment is
 * immers die van het testaccount zelf (geen super-admin). De beveiliging zit
 * 'm in de cookie: die kan alleen ooit gezet zijn door een `enterTestomgeving`-
 * aanroep die zelf wél achter `requireSuperAdmin()` zat.
 */
export async function verlaatTestomgeving() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(ADMIN_RETURN_SESSION_COOKIE)?.value;
  cookieStore.delete(ADMIN_RETURN_SESSION_COOKIE);

  if (!raw) redirect("/dashboard");

  let stored: { access_token: string; refresh_token: string };
  try {
    stored = JSON.parse(raw);
  } catch {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.setSession(stored);
  if (error) redirect("/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_super_admin")
    .eq("id", user?.id ?? "")
    .single();

  redirect(profile?.is_super_admin ? "/admin" : "/dashboard");
}

/**
 * Zet de testorganisatie terug naar een lege staat — verwijdert alle offertes
 * (incl. gekoppelde blokken/versies/handtekeningen/reacties/contactlogs),
 * klanten, templates, blok-templates, facturen (incl. factuurregels),
 * factuurartikelen, offerte-aanvragen, publieke-pagina-events en gesloten
 * dagen. Organisatie-instellingen (naam, logo, huisstijl, factuurinstellingen
 * e.d.) en het teamlid/login blijven bewust ongemoeid — dat is omgeving-
 * configuratie, geen testdata.
 */
export async function resetTestomgeving() {
  await requireSuperAdmin();
  const admin = createAdminClient();

  // invoices.deposit_invoice_id/credit_for_invoice_id verwijzen (RESTRICT)
  // naar een andere rij in dezelfde tabel — eerst loskoppelen, anders faalt
  // de delete hieronder zodra een slotfactuur/creditnota nog naar een andere
  // factuur wijst.
  const { error: unlinkError } = await admin
    .from("invoices")
    .update({ deposit_invoice_id: null, credit_for_invoice_id: null })
    .eq("organization_id", TEST_ORGANIZATION_ID);
  if (unlinkError) throw unlinkError;

  // invoices.quote_id is RESTRICT richting quotes -- dus facturen eerst.
  const tablesInOrder = [
    "invoices",
    "quotes",
    "quote_requests",
    "clients",
    "templates",
    "block_templates",
    "invoice_catalog_items",
    "public_page_events",
    "closed_dates",
  ] as const;

  for (const table of tablesInOrder) {
    const { error } = await admin.from(table).delete().eq("organization_id", TEST_ORGANIZATION_ID);
    if (error) throw error;
  }

  const { error: counterError } = await admin
    .from("organizations")
    .update({ next_invoice_number: 1, next_client_number: 1 })
    .eq("id", TEST_ORGANIZATION_ID);
  if (counterError) throw counterError;

  revalidatePath("/admin/testomgeving");
}
