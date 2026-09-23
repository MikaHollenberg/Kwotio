"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
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
import { GripVertical, Pencil, Archive, ArchiveRestore, Plus, Boxes, Gauge, CalendarRange } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button, ButtonLink } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { ArrangementPricingMode } from "@/lib/types/database";
import { reorderArrangements, archiveArrangement, unarchiveArrangement } from "./actions";

type ArrangementRow = {
  id: string;
  name: string;
  description: string;
  category: string;
  color_code: string;
  base_price: number;
  pricing_mode: ArrangementPricingMode;
  sort_order: number;
  archived_at: string | null;
};

const PRICING_MODE_LABELS: Record<ArrangementPricingMode, string> = {
  vast: "Vaste prijs",
  staffel: "Staffelprijs",
  seizoen: "Seizoensprijs",
};
const PRICING_MODE_ICONS: Record<ArrangementPricingMode, typeof Gauge> = {
  vast: Boxes,
  staffel: Gauge,
  seizoen: CalendarRange,
};

function ArrangementCard({ arrangement, dragging }: { arrangement: ArrangementRow; dragging?: boolean }) {
  const Icon = PRICING_MODE_ICONS[arrangement.pricing_mode];
  return (
    <Card
      className={dragging ? "shadow-lg" : undefined}
      style={{ borderLeftWidth: 4, borderLeftColor: arrangement.color_code }}
    >
      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-display text-base font-semibold text-ink-500">{arrangement.name}</p>
            {arrangement.category && (
              <span
                className="mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
                style={{ backgroundColor: `${arrangement.color_code}1a`, color: arrangement.color_code }}
              >
                {arrangement.category}
              </span>
            )}
          </div>
        </div>
        {arrangement.description && <p className="line-clamp-2 text-xs text-ink-400">{arrangement.description}</p>}
        <div className="mt-1 flex items-center justify-between gap-2 text-sm">
          <span className="flex items-center gap-1.5 text-ink-400">
            <Icon className="size-3.5" /> {PRICING_MODE_LABELS[arrangement.pricing_mode]}
          </span>
          <span className="font-display font-semibold text-ink-500">
            {arrangement.pricing_mode !== "vast" && "vanaf "}
            {formatCurrency(arrangement.base_price)}
          </span>
        </div>
      </div>
    </Card>
  );
}

function SortableCard({ arrangement, onArchive }: { arrangement: ArrangementRow; onArchive: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: arrangement.id,
    transition: { duration: 350, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="group relative"
    >
      <Link href={`/dashboard/arrangementen/${arrangement.id}`} className="block">
        <ArrangementCard arrangement={arrangement} dragging={isDragging} />
      </Link>
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Verslepen om te herordenen"
        className="absolute right-2 top-2 flex size-7 cursor-grab items-center justify-center rounded-brand-sm text-ink-300 opacity-0 transition-opacity duration-200 ease-brand hover:bg-sand-200 hover:text-ink-500 group-hover:opacity-100 active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </button>
      <div className="absolute bottom-2 right-2 flex items-center gap-1 opacity-0 transition-opacity duration-200 ease-brand group-hover:opacity-100">
        <Link
          href={`/dashboard/arrangementen/${arrangement.id}`}
          className="flex size-7 items-center justify-center rounded-brand-sm bg-white text-ink-400 shadow-sm hover:bg-sand-200 hover:text-ink-500"
        >
          <Pencil className="size-3.5" />
        </Link>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onArchive();
          }}
          title="Archiveren"
          className="flex size-7 items-center justify-center rounded-brand-sm bg-white text-ink-400 shadow-sm hover:bg-sand-200 hover:text-ink-500"
        >
          <Archive className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

export function ArrangementenList({ arrangements: initial }: { arrangements: ArrangementRow[] }) {
  const [arrangements, setArrangements] = useState(initial);
  const [showArchived, setShowArchived] = useState(false);
  const [pending, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const visible = useMemo(() => arrangements.filter((a) => !a.archived_at), [arrangements]);
  const archived = useMemo(() => arrangements.filter((a) => a.archived_at), [arrangements]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = visible.findIndex((a) => a.id === active.id);
    const newIndex = visible.findIndex((a) => a.id === over.id);
    const reordered = arrayMove(visible, oldIndex, newIndex);
    setArrangements([...reordered, ...archived]);
    startTransition(() => reorderArrangements(reordered.map((a) => a.id)));
  }

  function handleArchive(id: string) {
    startTransition(async () => {
      await archiveArrangement(id);
      setArrangements((prev) => prev.map((a) => (a.id === id ? { ...a, archived_at: new Date().toISOString() } : a)));
    });
  }

  function handleUnarchive(id: string) {
    startTransition(async () => {
      await unarchiveArrangement(id);
      setArrangements((prev) => prev.map((a) => (a.id === id ? { ...a, archived_at: null } : a)));
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-ink-400">Aanbod</p>
          <h2 className="font-display text-2xl font-semibold text-ink-500">Arrangementen</h2>
        </div>
        <ButtonLink href="/dashboard/arrangementen/nieuw">
          <Plus className="size-4" /> Nieuw arrangement
        </ButtonLink>
      </div>

      {visible.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <Boxes className="kw-bob size-8 text-ink-300" />
          <p className="text-sm text-ink-400">
            Nog geen arrangementen. Bouw je eerste arrangement met groeps- of seizoensprijzen.
          </p>
          <ButtonLink href="/dashboard/arrangementen/nieuw" size="sm" className="mt-1">
            <Plus className="size-4" /> Eerste arrangement maken
          </ButtonLink>
        </Card>
      ) : (
        <DndContext id="arrangementen-list" sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={visible.map((a) => a.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((arrangement) => (
                <SortableCard key={arrangement.id} arrangement={arrangement} onArchive={() => handleArchive(arrangement.id)} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {archived.length > 0 && (
        <div className="flex flex-col gap-3">
          <Button variant="ghost" size="sm" onClick={() => setShowArchived((v) => !v)} className="w-fit">
            {showArchived ? "Verberg" : "Toon"} gearchiveerd ({archived.length})
          </Button>
          {showArchived && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {archived.map((arrangement) => (
                <div key={arrangement.id} className="flex flex-col gap-2 opacity-60">
                  <ArrangementCard arrangement={arrangement} />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    onClick={() => handleUnarchive(arrangement.id)}
                    className="w-fit"
                  >
                    <ArchiveRestore className="size-3.5" /> Herstellen
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
