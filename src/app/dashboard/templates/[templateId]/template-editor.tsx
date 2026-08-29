"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, Smartphone, Monitor } from "lucide-react";
import type { Database } from "@/lib/types/database";
import type { BlockDraft, BlockTemplateSummary } from "@/lib/blocks/types";
import { newBlock, newBlockFromTemplate } from "@/lib/blocks/types";
import { updateTemplateMeta, saveTemplateBlocksAction, deleteTemplate } from "@/app/dashboard/templates/actions";
import { useAutosave } from "@/hooks/use-autosave";
import { AutosaveIndicator } from "@/components/builder/autosave-indicator";
import { BlockList } from "@/components/builder/block-list";
import { AddBlockMenu } from "@/components/builder/add-block-menu";
import { TextInput } from "@/components/builder/field";
import { QuotePreview } from "@/components/preview/quote-preview";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";

type Template = Database["public"]["Tables"]["templates"]["Row"];

export function TemplateEditor({
  template,
  initialBlocks,
  organizationId,
  initialBlockTemplates,
}: {
  template: Template;
  initialBlocks: BlockDraft[];
  organizationId: string;
  initialBlockTemplates: BlockTemplateSummary[];
}) {
  const router = useRouter();
  const [name, setName] = useState(template.name);
  const [eventType, setEventType] = useState(template.event_type);
  const [isActive, setIsActive] = useState(template.is_active);
  const [blocks, setBlocks] = useState<BlockDraft[]>(initialBlocks);
  const [blockTemplates, setBlockTemplates] = useState<BlockTemplateSummary[]>(initialBlockTemplates);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletePending, startDeleteTransition] = useTransition();

  const status = useAutosave({ name, eventType, isActive, blocks }, async (value) => {
    await Promise.all([
      updateTemplateMeta(template.id, {
        name: value.name,
        eventType: value.eventType,
        language: template.language,
        isActive: value.isActive,
      }),
      saveTemplateBlocksAction(template.id, value.blocks),
    ]);
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/templates"
            className="flex size-9 items-center justify-center rounded-brand-sm text-ink-400 hover:bg-sand-200"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="font-display text-xl font-semibold text-ink-500 outline-none focus:border-b focus:border-teal-400"
            />
            <div className="mt-0.5">
              <AutosaveIndicator status={status} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <TextInput
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            placeholder="Type offerte"
            className="h-9 w-44"
          />
          <label className="flex items-center gap-1.5 text-sm text-ink-400">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="size-4 accent-teal-600"
            />
            Actief
          </label>
          <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmOpen(true)}>
            <Trash2 className="size-4" />
          </Button>

          <ConfirmDialog
            open={deleteConfirmOpen}
            title="Template verwijderen"
            description={`Weet je zeker dat je template "${name}" wilt verwijderen?`}
            confirmLabel="Verwijderen"
            danger
            pending={deletePending}
            onConfirm={() => {
              startDeleteTransition(async () => {
                await deleteTemplate(template.id);
                router.push("/dashboard/templates");
              });
            }}
            onCancel={() => setDeleteConfirmOpen(false)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_480px]">
        <div className="flex flex-col gap-3">
          <BlockList
            blocks={blocks}
            onChange={setBlocks}
            organizationId={organizationId}
            onTemplateSaved={(template) => setBlockTemplates([...blockTemplates, template])}
          />
          <AddBlockMenu
            blockTemplates={blockTemplates}
            onAdd={(type, template) =>
              setBlocks([...blocks, template ? newBlockFromTemplate(template, blocks.length) : newBlock(type, blocks.length)])
            }
          />
        </div>

        <div className="xl:sticky xl:top-6 xl:self-start">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-ink-500">Live preview</p>
            <div className="flex gap-1 rounded-brand-sm bg-sand-200 p-1">
              <button
                onClick={() => setPreviewMode("desktop")}
                className={cn("flex size-7 items-center justify-center rounded-brand-sm", previewMode === "desktop" ? "bg-white shadow-sm" : "text-ink-400")}
              >
                <Monitor className="size-3.5" />
              </button>
              <button
                onClick={() => setPreviewMode("mobile")}
                className={cn("flex size-7 items-center justify-center rounded-brand-sm", previewMode === "mobile" ? "bg-white shadow-sm" : "text-ink-400")}
              >
                <Smartphone className="size-3.5" />
              </button>
            </div>
          </div>
          <div className="max-h-[calc(100vh-160px)] overflow-y-auto rounded-brand-lg bg-sand-200 p-4">
            <QuotePreview
              blocks={blocks}
              mode={previewMode}
              meta={{
                title: name,
                clientName: "Voorbeeldklant",
                eventDate: null,
                currency: "EUR",
                priceDisplay: "incl_btw",
                pricePerPerson: false,
                discountAmount: 0,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
