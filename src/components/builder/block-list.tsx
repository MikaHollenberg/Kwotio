"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, GripVertical, Trash2, BookmarkPlus } from "lucide-react";
import type { BlockDraft, BlockTemplateSummary } from "@/lib/blocks/types";
import { BLOCK_LABELS } from "@/lib/blocks/types";
import { BlockEditorSwitch } from "@/components/builder/block-editor-switch";
import { SaveAsBlockTemplateDialog } from "@/components/builder/save-as-block-template-dialog";
import { createBlockTemplateFromContent } from "@/app/dashboard/templates/blokken/actions";
import { cn } from "@/lib/utils";

function blockSummary(block: BlockDraft): string {
  const content = block.content as Record<string, unknown>;
  if (typeof content.heading === "string" && content.heading) return content.heading;
  return BLOCK_LABELS[block.type];
}

function SortableBlockCard({
  block,
  expanded,
  onToggle,
  onContentChange,
  onDelete,
  onSaveAsTemplate,
  organizationId,
}: {
  block: BlockDraft;
  expanded: boolean;
  onToggle: () => void;
  onContentChange: (content: Record<string, unknown>) => void;
  onDelete: () => void;
  onSaveAsTemplate: () => void;
  organizationId: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "rounded-brand-lg border border-ink-200/60 bg-white",
        isDragging && "z-10 shadow-lg",
      )}
    >
      <div className="flex items-center gap-2 px-3 py-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="flex size-8 shrink-0 cursor-grab items-center justify-center rounded-brand-sm text-ink-300 hover:bg-sand-200 hover:text-ink-500 active:cursor-grabbing"
        >
          <GripVertical className="size-4" />
        </button>

        <button
          type="button"
          onClick={onToggle}
          className="flex flex-1 items-center justify-between gap-3 text-left"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-600">
              {BLOCK_LABELS[block.type]}
            </p>
            <p className="text-sm font-medium text-ink-500">{blockSummary(block)}</p>
          </div>
          <ChevronDown className={cn("size-4 shrink-0 text-ink-300 transition-transform duration-200 ease-brand", expanded && "rotate-180")} />
        </button>

        <button
          type="button"
          onClick={onSaveAsTemplate}
          title="Opslaan als blok-template"
          className="flex size-8 shrink-0 items-center justify-center rounded-brand-sm text-ink-300 hover:bg-sand-200 hover:text-ink-500"
        >
          <BookmarkPlus className="size-4" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          title="Blok verwijderen"
          className="flex size-8 shrink-0 items-center justify-center rounded-brand-sm text-ink-300 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      {expanded && (
        <div className="border-t border-ink-100 px-4 py-4">
          <BlockEditorSwitch block={block} onChange={onContentChange} organizationId={organizationId} />
        </div>
      )}
    </div>
  );
}

export function BlockList({
  blocks,
  onChange,
  organizationId,
  onTemplateSaved,
}: {
  blocks: BlockDraft[];
  onChange: (blocks: BlockDraft[]) => void;
  organizationId: string;
  /** Aangeroepen zodra "Opslaan als blok-template" gelukt is, zodat de
   * nieuwe template meteen in AddBlockMenu verschijnt zonder herladen. */
  onTemplateSaved?: (template: BlockTemplateSummary) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(blocks[0]?.id ?? null);
  const [templateSourceBlock, setTemplateSourceBlock] = useState<BlockDraft | null>(null);
  const [savePending, startSaveTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function handleSaveAsTemplate(name: string) {
    if (!templateSourceBlock) return;
    startSaveTransition(async () => {
      const template = await createBlockTemplateFromContent({
        name,
        type: templateSourceBlock.type,
        content: templateSourceBlock.content,
      });
      onTemplateSaved?.(template);
      setTemplateSourceBlock(null);
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    const reordered = arrayMove(blocks, oldIndex, newIndex).map((b, i) => ({ ...b, position: i }));
    onChange(reordered);
  }

  if (blocks.length === 0) {
    return (
      <div className="rounded-brand-lg border border-dashed border-ink-200 bg-sand-50 px-6 py-10 text-center text-sm text-ink-400">
        Nog geen blokken. Voeg hieronder je eerste blok toe.
      </div>
    );
  }

  return (
    <DndContext
      id="block-list"
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-3">
          {blocks.map((block) => (
            <SortableBlockCard
              key={block.id}
              block={block}
              expanded={expandedId === block.id}
              onToggle={() => setExpandedId(expandedId === block.id ? null : block.id)}
              onContentChange={(content) =>
                onChange(blocks.map((b) => (b.id === block.id ? { ...b, content } : b)))
              }
              onDelete={() => onChange(blocks.filter((b) => b.id !== block.id).map((b, i) => ({ ...b, position: i })))}
              onSaveAsTemplate={() => setTemplateSourceBlock(block)}
              organizationId={organizationId}
            />
          ))}
        </div>
      </SortableContext>

      <SaveAsBlockTemplateDialog
        key={templateSourceBlock?.id ?? "none"}
        open={templateSourceBlock !== null}
        defaultName={templateSourceBlock ? BLOCK_LABELS[templateSourceBlock.type] : ""}
        pending={savePending}
        onSave={handleSaveAsTemplate}
        onCancel={() => setTemplateSourceBlock(null)}
      />
    </DndContext>
  );
}
