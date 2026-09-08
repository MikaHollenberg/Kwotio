"use server";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Publieke, niet-ingelogde logging voor de publieke organisatiepagina —
 * zelfde beveiligingsfilosofie als submitQuoteRequest: nooit een
 * client-supplied organization_id vertrouwen, altijd opnieuw via de slug
 * opzoeken. Faalt bewust stil (analytics mag de pagina nooit breken).
 */

export async function logPageView(organizationId: string) {
  try {
    const supabase = createAdminClient();
    await supabase.from("public_page_events").insert({ organization_id: organizationId, type: "page_view" });
  } catch {
    // stil negeren — analytics mag de pagina nooit breken
  }
}

export async function logTemplateOpened(orgSlug: string, templateId: string) {
  try {
    const supabase = createAdminClient();
    const { data: organization } = await supabase
      .from("organizations")
      .select("id")
      .eq("public_slug", orgSlug)
      .maybeSingle();
    if (!organization) return;

    const { data: template } = await supabase
      .from("templates")
      .select("id")
      .eq("id", templateId)
      .eq("organization_id", organization.id)
      .eq("is_publicly_visible", true)
      .maybeSingle();
    if (!template) return;

    await supabase.from("public_page_events").insert({
      organization_id: organization.id,
      template_id: template.id,
      type: "template_opened",
    });
  } catch {
    // stil negeren
  }
}

export async function logRequestFormOpened(orgSlug: string) {
  try {
    const supabase = createAdminClient();
    const { data: organization } = await supabase
      .from("organizations")
      .select("id")
      .eq("public_slug", orgSlug)
      .maybeSingle();
    if (!organization) return;

    await supabase.from("public_page_events").insert({ organization_id: organization.id, type: "request_form_opened" });
  } catch {
    // stil negeren
  }
}
