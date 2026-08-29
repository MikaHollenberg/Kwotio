import { Plus, LayoutTemplate } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeIcon } from "@/components/brand/theme-icon";
import { EVENT_TYPE_LABELS, EVENT_TYPE_ICONS } from "@/lib/blocks/event-types";
import { TemplatesTabs } from "@/components/builder/templates-tabs";

export default async function TemplatesPage() {
  const supabase = await createClient();
  const { data: templates } = await supabase
    .from("templates")
    .select("id, name, event_type, is_active, language, updated_at")
    .order("updated_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-ink-400">Templatebibliotheek</p>
          <h2 className="font-display text-2xl font-semibold text-ink-500">Templates</h2>
        </div>
        <ButtonLink href="/dashboard/templates/nieuw">
          <Plus className="size-4" /> Nieuw template
        </ButtonLink>
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
          {templates.map((t) => (
            <a key={t.id} href={`/dashboard/templates/${t.id}`}>
              <Card className="h-full transition-shadow duration-200 ease-brand hover:shadow-md">
                <CardContent className="flex h-full flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <ThemeIcon icon={EVENT_TYPE_ICONS[t.event_type]} size={36} />
                    {!t.is_active && <Badge tone="neutral">Inactief</Badge>}
                  </div>
                  <div>
                    <p className="font-display text-lg font-semibold text-ink-500">{t.name}</p>
                    <p className="text-sm text-ink-400">{EVENT_TYPE_LABELS[t.event_type]}</p>
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
