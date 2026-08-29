import { Plus, LayoutTemplate } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BLOCK_LABELS, BLOCK_ICONS, BLOCK_ORDER } from "@/lib/blocks/types";
import { TemplatesTabs } from "@/components/builder/templates-tabs";
import type { BlockType } from "@/lib/types/database";

function contentPreview(content: Record<string, unknown>): string | null {
  return typeof content.heading === "string" && content.heading ? content.heading : null;
}

export default async function BlokTemplatesPage() {
  const supabase = await createClient();
  const { data: blockTemplates } = await supabase
    .from("block_templates")
    .select("id, type, name, content, updated_at")
    .order("updated_at", { ascending: false });

  const byType = new Map<BlockType, typeof blockTemplates>();
  for (const type of BLOCK_ORDER) byType.set(type, []);
  for (const bt of blockTemplates ?? []) {
    if (!byType.has(bt.type)) byType.set(bt.type, []);
    byType.get(bt.type)!.push(bt);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-ink-400">Templatebibliotheek</p>
          <h2 className="font-display text-2xl font-semibold text-ink-500">Templates</h2>
        </div>
        <ButtonLink href="/dashboard/templates/blokken/nieuw">
          <Plus className="size-4" /> Nieuwe blok-template
        </ButtonLink>
      </div>

      <TemplatesTabs active="blokken" />

      {!blockTemplates || blockTemplates.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <LayoutTemplate className="size-8 text-ink-300" />
          <p className="max-w-md text-sm text-ink-400">
            Nog geen blok-templates. Maak er één aan van bijv. een standaard intro of een
            pakketten-blok dat je vaak hergebruikt — daarna kies je &apos;m bij &ldquo;Blok
            toevoegen&rdquo; op elke offerte of template.
          </p>
          <ButtonLink href="/dashboard/templates/blokken/nieuw" size="sm" className="mt-1">
            <Plus className="size-4" /> Eerste blok-template maken
          </ButtonLink>
        </Card>
      ) : (
        <div className="flex flex-col gap-8">
          {BLOCK_ORDER.filter((type) => (byType.get(type)?.length ?? 0) > 0).map((type) => (
            <div key={type}>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink-400">
                <span className="text-base">{BLOCK_ICONS[type]}</span> {BLOCK_LABELS[type]}
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {byType.get(type)!.map((bt) => (
                  <a key={bt.id} href={`/dashboard/templates/blokken/${bt.id}`}>
                    <Card className="h-full transition-shadow duration-200 ease-brand hover:shadow-md">
                      <CardContent className="flex h-full flex-col gap-1">
                        <p className="font-display text-lg font-semibold text-ink-500">{bt.name}</p>
                        {contentPreview(bt.content as Record<string, unknown>) && (
                          <p className="truncate text-sm text-ink-400">
                            {contentPreview(bt.content as Record<string, unknown>)}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
