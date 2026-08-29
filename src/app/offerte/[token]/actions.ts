"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/client";
import { quoteOpenedAgencyEmail, newCommentAgencyEmail } from "@/lib/email/templates/notifications";
import type { Selections } from "@/lib/blocks/pricing";

const ACCESS_COOKIE_PREFIX = "qac_";

async function getQuoteIdByToken(token: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("quotes")
    .select("id, organization_id, status, title, client_id, created_by")
    .eq("share_token", token)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function notifyAgency(
  supabase: ReturnType<typeof createAdminClient>,
  quote: { organization_id: string; created_by: string | null; id: string },
  build: (args: { organizationName: string; dashboardUrl: string }) => { subject: string; html: string },
) {
  const [{ data: organization }, h] = await Promise.all([
    supabase.from("organizations").select("brand_name").eq("id", quote.organization_id).single(),
    headers(),
  ]);

  let notifyEmail: string | null = null;
  if (quote.created_by) {
    const { data: creator } = await supabase.from("profiles").select("email").eq("id", quote.created_by).maybeSingle();
    notifyEmail = creator?.email ?? null;
  }
  if (!notifyEmail) {
    const { data: owner } = await supabase
      .from("profiles")
      .select("email")
      .eq("organization_id", quote.organization_id)
      .eq("role", "owner")
      .limit(1)
      .maybeSingle();
    notifyEmail = owner?.email ?? null;
  }
  if (!notifyEmail) return;

  const dashboardUrl = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}/dashboard/offertes/${quote.id}`;
  const { subject, html } = build({
    organizationName: organization?.brand_name ?? "Feest aan het Water",
    dashboardUrl,
  });
  await sendEmail({ to: notifyEmail, subject, html });
}

async function logActivity(
  supabase: ReturnType<typeof createAdminClient>,
  quoteId: string,
  type: "viewed" | "section_viewed" | "option_changed" | "comment_added",
  metadata: Record<string, unknown> = {},
) {
  const h = await headers();
  await supabase.from("activity_events").insert({
    quote_id: quoteId,
    type,
    metadata,
    ip_address: h.get("x-forwarded-for") ?? null,
    user_agent: h.get("user-agent") ?? null,
  });
}

export async function verifyAccessCode(token: string, code: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data: quote } = await supabase
    .from("quotes")
    .select("access_code")
    .eq("share_token", token)
    .maybeSingle();

  if (!quote?.access_code || quote.access_code !== code) return false;

  const cookieStore = await cookies();
  cookieStore.set(`${ACCESS_COOKIE_PREFIX}${token}`, "1", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: `/offerte/${token}`,
  });
  return true;
}

export async function hasAccessCookie(token: string): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(`${ACCESS_COOKIE_PREFIX}${token}`)?.value === "1";
}

export async function trackView(token: string) {
  const quote = await getQuoteIdByToken(token);
  if (!quote) return;
  const supabase = createAdminClient();

  await logActivity(supabase, quote.id, "viewed");

  if (quote.status === "verzonden") {
    await supabase
      .from("quotes")
      .update({ status: "bekeken", first_viewed_at: new Date().toISOString() })
      .eq("id", quote.id);

    const client = quote.client_id
      ? (await supabase.from("clients").select("name").eq("id", quote.client_id).maybeSingle()).data
      : null;

    await notifyAgency(supabase, quote, ({ organizationName, dashboardUrl }) => ({
      subject: `${client?.name ?? "Een klant"} heeft "${quote.title}" geopend`,
      html: quoteOpenedAgencyEmail({
        organizationName,
        quoteTitle: quote.title,
        clientName: client?.name ?? "Een klant",
        dashboardUrl,
      }),
    }));
  }
}

export async function trackSectionView(token: string, blockId: string) {
  const quote = await getQuoteIdByToken(token);
  if (!quote) return;
  const supabase = createAdminClient();
  await logActivity(supabase, quote.id, "section_viewed", { blockId });
}

export async function updateSelection(token: string, selections: Selections) {
  const quote = await getQuoteIdByToken(token);
  if (!quote) return;
  const supabase = createAdminClient();

  await supabase
    .from("quotes")
    .update({ selected_packages: selections.packageIdByBlock, selected_addons: selections.addonQuantities })
    .eq("id", quote.id);

  await logActivity(supabase, quote.id, "option_changed", {
    selectedPackages: selections.packageIdByBlock,
    addonQuantities: selections.addonQuantities,
  });
}

export async function submitComment(
  token: string,
  input: { blockId: string | null; authorName: string; body: string },
) {
  const quote = await getQuoteIdByToken(token);
  if (!quote) throw new Error("Offerte niet gevonden.");
  const supabase = createAdminClient();

  const { error } = await supabase.from("comments").insert({
    quote_id: quote.id,
    block_id: input.blockId,
    author_type: "client",
    author_name: input.authorName,
    body: input.body,
  });
  if (error) throw error;

  await logActivity(supabase, quote.id, "comment_added", { blockId: input.blockId });

  if (quote.status === "verzonden" || quote.status === "bekeken") {
    await supabase.from("quotes").update({ status: "in_overleg" }).eq("id", quote.id);
  }

  await notifyAgency(supabase, quote, ({ organizationName, dashboardUrl }) => ({
    subject: `Nieuwe reactie op "${quote.title}"`,
    html: newCommentAgencyEmail({
      organizationName,
      quoteTitle: quote.title,
      authorName: input.authorName,
      body: input.body,
      dashboardUrl,
    }),
  }));

  revalidatePath(`/offerte/${token}`);
}
