import { Plus, LayoutTemplate, Archive } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TemplatesTabs } from "@/components/builder/templates-tabs";
import { TemplatesList } from "./templates-list";

export default async function TemplatesPage() {
  const supabase = await createClient();
  const { data: templates } = await supabase
    .from("templates")
    .select("id, name, event_type, is_active")
    .is("archived_at", null)
    .order("sort_order", { ascending: true });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-ink-400">Templatebibliotheek</p>
          <h2 className="font-display text-2xl font-semibold text-ink-500">Templates</h2>
        </div>
        <div className="flex items-center gap-2">
          <ButtonLink href="/dashboard/templates/archief" variant="outline">
            <Archive className="size-4" /> Gearchiveerde templates
          </ButtonLink>
          <ButtonLink href="/dashboard/templates/nieuw" data-faq-id="new-template-button">
            <Plus className="size-4" /> Nieuw template
          </ButtonLink>
        </div>
      </div>

      <div data-faq-id="templates-tabs">
        <TemplatesTabs active="offertes" />
      </div>

      {!templates || templates.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <LayoutTemplate className="size-8 text-ink-300" />
          <p className="text-sm text-ink-400">
            Nog geen templates. Maak er één aan om offertes in enkele minuten samen te stellen.
          </p>
          <ButtonLink href="/dashboard/templates/nieuw" size="sm" className="mt-1">
            <Plus className="size-4" /> Eerste template maken
          </ButtonLink>
        </Card>
      ) : (
        <TemplatesList templates={templates} />
      )}
    </div>
  );
}
