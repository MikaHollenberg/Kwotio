import { Plus, LayoutTemplate, Archive } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeIcon, detectThemeIcon } from "@/components/brand/theme-icon";
import { TemplatesTabs } from "@/components/builder/templates-tabs";
import { TemplateRowActions } from "./template-row-actions";

export default async function TemplatesPage() {
  const supabase = await createClient();
  const { data: templates } = await supabase
    .from("templates")
    .select("id, name, event_type, is_active, language, updated_at")
    .is("archived_at", null)
    .order("updated_at", { ascending: false });

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
          <ButtonLink href="/dashboard/templates/nieuw">
            <Plus className="size-4" /> Nieuw template
          </ButtonLink>
        </div>
      </div>

      <TemplatesTabs active="offertes" />

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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {templates.map((t) => {
            const iconKey = detectThemeIcon(t.event_type);
            return (
              <Card key={t.id} className="h-full transition-shadow duration-200 ease-brand hover:shadow-md">
                <CardContent className="flex h-full flex-col gap-3">
                  <a href={`/dashboard/templates/${t.id}`} className="flex flex-1 flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      {iconKey ? (
                        <ThemeIcon icon={iconKey} size={36} />
                      ) : (
                        <LayoutTemplate className="size-9 text-ink-300" />
                      )}
                      {!t.is_active && <Badge tone="neutral">Inactief</Badge>}
                    </div>
                    <div>
                      <p className="font-display text-lg font-semibold text-ink-500">{t.name}</p>
                      <p className="text-sm text-ink-400">{t.event_type}</p>
                    </div>
                  </a>
                  <div className="-mx-2 -mb-2 flex items-center justify-end border-t border-ink-50 pt-1">
                    <TemplateRowActions templateId={t.id} name={t.name} archived={false} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
