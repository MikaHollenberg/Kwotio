"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import type { Database } from "@/lib/types/database";
import type { BlockDraft } from "@/lib/blocks/types";
import { BLOCK_LABELS, BLOCK_ICONS } from "@/lib/blocks/types";
import { renameBlockTemplate, saveBlockTemplateContent, deleteBlockTemplate } from "../actions";
import { useAutosave } from "@/hooks/use-autosave";
import { AutosaveIndicator } from "@/components/builder/autosave-indicator";
import { BlockEditorSwitch } from "@/components/builder/block-editor-switch";
import { BlockPreview } from "@/components/preview/quote-preview";
import { useQuoteSelections } from "@/hooks/use-quote-selections";
import { LanguageProvider } from "@/lib/i18n/language-context";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type BlockTemplateRow = Database["public"]["Tables"]["block_templates"]["Row"];

export function BlockTemplateEditor({
  blockTemplate,
  organizationId,
}: {
  blockTemplate: BlockTemplateRow;
  organizationId: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(blockTemplate.name);
  const [content, setContent] = useState<Record<string, unknown>>(blockTemplate.content);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletePending, startDeleteTransition] = useTransition();

  const status = useAutosave({ name, content }, async (value) => {
    await Promise.all([
      renameBlockTemplate(blockTemplate.id, value.name),
      saveBlockTemplateContent(blockTemplate.id, value.content),
    ]);
  });

  const block: BlockDraft = { id: blockTemplate.id, type: blockTemplate.type, position: 0, content };
  const { selections, setSelections } = useQuoteSelections([block]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/templates/blokken"
            className="flex size-9 items-center justify-center rounded-brand-sm text-ink-400 hover:bg-sand-200"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base">{BLOCK_ICONS[blockTemplate.type]}</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="font-display text-xl font-semibold text-ink-500 outline-none focus:border-b focus:border-teal-400"
              />
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-400">
              {BLOCK_LABELS[blockTemplate.type]}
              <AutosaveIndicator status={status} />
            </div>
          </div>
        </div>

        <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmOpen(true)}>
          <Trash2 className="size-4" />
        </Button>

        <ConfirmDialog
          open={deleteConfirmOpen}
          title="Blok-template verwijderen"
          description={`Weet je zeker dat je blok-template "${name}" wilt verwijderen? Dit heeft geen effect op offertes/templates waar deze al eerder in gebruikt is.`}
          confirmLabel="Verwijderen"
          danger
          pending={deletePending}
          onConfirm={() => {
            startDeleteTransition(async () => {
              await deleteBlockTemplate(blockTemplate.id);
              router.push("/dashboard/templates/blokken");
            });
          }}
          onCancel={() => setDeleteConfirmOpen(false)}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_480px]">
        <div className="rounded-brand-lg border border-ink-200/60 bg-white px-4 py-4">
          <BlockEditorSwitch block={block} onChange={setContent} organizationId={organizationId} />
        </div>

        <div className="xl:sticky xl:top-6 xl:self-start">
          <p className="mb-3 text-sm font-semibold text-ink-500">Live preview</p>
          <div className="max-h-[calc(100vh-160px)] overflow-y-auto rounded-brand-lg bg-sand-200 p-4">
            <div className="overflow-hidden rounded-brand-lg border border-ink-200/60 bg-white shadow-sm">
              <LanguageProvider initialLang="nl">
                <BlockPreview
                  block={block}
                  meta={{
                    title: "Voorbeeldofferte",
                    clientName: "Voorbeeldklant",
                    eventDate: null,
                    currency: "EUR",
                    priceDisplay: "incl_btw",
                    pricePerPerson: false,
                    discountAmount: 0,
                  }}
                  selections={selections}
                  onSelectionsChange={setSelections}
                />
              </LanguageProvider>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
