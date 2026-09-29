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
import { SortableContext, useSortable, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, LayoutTemplate } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TiltCard } from "@/components/dashboard/tilt-card";
import { ThemeIcon, detectThemeIcon } from "@/components/brand/theme-icon";
import { TemplateRowActions } from "./template-row-actions";
import { reorderTemplates } from "./actions";

export type TemplateRow = {
  id: string;
  name: string;
  event_type: string;
  is_active: boolean;
};

function SortableTemplateCard({ template }: { template: TemplateRow }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: template.id,
    transition: { duration: 350, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
  });
  const iconKey = detectThemeIcon(template.event_type);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="group relative"
    >
      <TiltCard className="h-full">
        <Card
          className={
            isDragging ? "h-full shadow-lg" : "h-full transition-shadow duration-200 ease-brand hover:shadow-md"
          }
        >
          <CardContent className="flex h-full flex-col gap-3">
            <a href={`/dashboard/templates/${template.id}`} className="flex flex-1 flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                {iconKey ? <ThemeIcon icon={iconKey} size={36} /> : <LayoutTemplate className="size-9 text-ink-300" />}
                {!template.is_active && <Badge tone="neutral">Inactief</Badge>}
              </div>
              <div>
                <p className="font-display text-lg font-semibold text-ink-500">{template.name}</p>
                <p className="text-sm text-ink-400">{template.event_type}</p>
              </div>
            </a>
            <div className="-mx-2 -mb-2 flex items-center justify-end border-t border-ink-50 pt-1">
              <TemplateRowActions templateId={template.id} name={template.name} archived={false} />
            </div>
          </CardContent>
        </Card>
      </TiltCard>
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Verslepen om te herordenen"
        className="absolute right-2 top-2 flex size-7 cursor-grab items-center justify-center rounded-brand-sm text-ink-300 opacity-0 transition-opacity duration-200 ease-brand hover:bg-sand-200 hover:text-ink-500 group-hover:opacity-100 active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </button>
    </div>
  );
}

/** Sleep-en-neerzet-volgorde voor de "Offerte-templates"-tab, zelfde patroon
 * als arrangementen-list.tsx. De volgorde die hier ingesteld wordt, bepaalt
 * ook de volgorde van "Onze offertes" op de publieke offertepagina (zie
 * offertes/[slug]/data.ts, die op dezelfde sort_order sorteert). */
export function TemplatesList({ templates: initial }: { templates: TemplateRow[] }) {
  const [templates, setTemplates] = useState(initial);
  const [, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = templates.findIndex((t) => t.id === active.id);
    const newIndex = templates.findIndex((t) => t.id === over.id);
    const reordered = arrayMove(templates, oldIndex, newIndex);
    setTemplates(reordered);
    startTransition(() => reorderTemplates(reordered.map((t) => t.id)));
  }

  return (
    <DndContext id="templates-list" sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={templates.map((t) => t.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 gap-4 [perspective:800px] sm:grid-cols-2 xl:grid-cols-3">
          {templates.map((template) => (
            <SortableTemplateCard key={template.id} template={template} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
