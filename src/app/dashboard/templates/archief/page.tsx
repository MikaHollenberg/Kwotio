import { ArrowLeft, Archive, LayoutTemplate } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeIcon, detectThemeIcon } from "@/components/brand/theme-icon";
import { TemplateRowActions } from "../template-row-actions";
import { formatDate } from "@/lib/utils";

export default async function TemplatesArchiefPage() {
  const supabase = await createClient();
  const { data: templates } = await supabase
    .from("templates")
    .select("id, name, event_type, archived_at")
    .not("archived_at", "is", null)
    .order("archived_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-ink-400">Templatebibliotheek</p>
          <h2 className="font-display text-2xl font-semibold text-ink-500">Gearchiveerde templates</h2>
        </div>
        <ButtonLink href="/dashboard/templates" variant="outline">
          <ArrowLeft className="size-4" /> Terug naar templates
        </ButtonLink>
      </div>

      {!templates || templates.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <Archive className="size-8 text-ink-300" />
          <p className="text-sm text-ink-400">Geen gearchiveerde templates.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {templates.map((t) => {
            const iconKey = detectThemeIcon(t.event_type);
            return (
              <Card key={t.id} className="h-full">
                <CardContent className="flex h-full flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    {iconKey ? (
                      <ThemeIcon icon={iconKey} size={36} />
                    ) : (
                      <LayoutTemplate className="size-9 text-ink-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-display text-lg font-semibold text-ink-500">{t.name}</p>
                    <p className="text-sm text-ink-400">{t.event_type}</p>
                    <p className="mt-1 text-xs text-ink-400">
                      Gearchiveerd op {t.archived_at ? formatDate(t.archived_at) : "—"}
                    </p>
                  </div>
                  <div className="-mx-2 -mb-2 flex items-center justify-end border-t border-ink-50 pt-1">
                    <TemplateRowActions templateId={t.id} name={t.name} archived />
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
