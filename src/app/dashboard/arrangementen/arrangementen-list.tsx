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
import { GripVertical, Pencil, Copy, Archive, ArchiveRestore, Plus, Boxes, Globe } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button, ButtonLink } from "@/components/ui/button";
import { TiltCard } from "@/components/dashboard/tilt-card";
import { ActionIconButton } from "@/components/dashboard/action-icon-button";
import { CollapsibleItem, COLLAPSE_MS } from "@/components/dashboard/collapsible-item";
import { formatCurrency } from "@/lib/utils";
import { reorderArrangements, archiveArrangement, unarchiveArrangement, duplicateArrangement } from "./actions";

type ArrangementRow = {
  id: string;
  name: string;
  description: string;
  category: string;
  color_code: string;
  is_publicly_visible: boolean;
  sort_order: number;
  archived_at: string | null;
  startingPrice: number | null;
  pricePerPerson: boolean;
  /** Meer dan één prijsregel, of een toeslag -- de kaart toont dan "vanaf". */
  isVariable: boolean;
  /** Vaakst aan een offerte toegevoegd deze maand (minimaal 2 keer). */
  isPopular: boolean;
};

function ArrangementCard({ arrangement, dragging }: { arrangement: ArrangementRow; dragging?: boolean }) {
  return (
    <TiltCard>
      <Card
        className={dragging ? "shadow-lg" : undefined}
        style={{ borderLeftWidth: 4, borderLeftColor: arrangement.color_code }}
      >
        <div className="flex flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-display text-base font-semibold text-ink-500">{arrangement.name}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1">
              {arrangement.category && (
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style={{ backgroundColor: `${arrangement.color_code}1a`, color: arrangement.color_code }}
                >
                  {arrangement.category}
                </span>
              )}
              {arrangement.is_publicly_visible && (
                <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-700">
                  <Globe className="size-3" /> Publiek
                </span>
              )}
              {arrangement.isPopular && (
                <span
                  title="Vaakst aan een offerte toegevoegd deze maand"
                  className="kw-fire-pulse inline-flex items-center gap-1 rounded-full bg-gradient-to-br from-orange-400 to-red-500 px-2 py-0.5 text-[11px] font-bold text-white"
                >
                  🔥 Populair
                </span>
              )}
            </div>
          </div>
        </div>
        {arrangement.description && <p className="line-clamp-2 text-xs text-ink-400">{arrangement.description}</p>}
        {arrangement.startingPrice != null && (
          <div className="mt-1 flex items-center justify-end text-sm">
            <span className="font-display font-semibold text-ink-500">
              {arrangement.isVariable && "vanaf "}
              {formatCurrency(arrangement.startingPrice)}
              {arrangement.pricePerPerson && " p.p."}
            </span>
          </div>
        )}
      </div>
      </Card>
    </TiltCard>
  );
}

function SortableCard({
  arrangement,
  collapsed,
  onArchive,
  onDuplicate,
}: {
  arrangement: ArrangementRow;
  collapsed: boolean;
  onArchive: () => Promise<void>;
  onDuplicate: () => Promise<void>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: arrangement.id,
    transition: { duration: 350, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
  });

  return (
    <CollapsibleItem collapsed={collapsed}>
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
        <div
          className="absolute bottom-2 right-2 flex items-center gap-1 opacity-0 transition-opacity duration-200 ease-brand group-hover:opacity-100"
          onClick={(e) => e.preventDefault()}
        >
          <Link
            href={`/dashboard/arrangementen/${arrangement.id}`}
            className="flex size-7 items-center justify-center rounded-brand-sm bg-white text-ink-400 shadow-sm hover:bg-sand-200 hover:text-ink-500"
          >
            <Pencil className="size-3.5" />
          </Link>
          <ActionIconButton
            icon={Copy}
            title="Dupliceren"
            onAction={onDuplicate}
            iconClassName="size-3.5"
            className="size-7 bg-white shadow-sm hover:bg-sand-200"
          />
          <ActionIconButton
            icon={Archive}
            title="Archiveren"
            onAction={onArchive}
            iconClassName="size-3.5"
            className="size-7 bg-white shadow-sm hover:bg-sand-200"
          />
        </div>
      </div>
    </CollapsibleItem>
  );
}

export function ArrangementenList({ arrangements: initial }: { arrangements: ArrangementRow[] }) {
  const [arrangements, setArrangements] = useState(initial);
  const [collapsingIds, setCollapsingIds] = useState<Set<string>>(new Set());
  const [showArchived, setShowArchived] = useState(false);
  const [pending, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  // Blijft nog even meetellen als "zichtbaar" terwijl 'm wegkrimpt, ook al
  // is archived_at hierboven al gezet -- anders springt de kaart in één
  // klap weg zodra de server-actie klaar is, i.p.v. netjes te krimpen.
  const visible = useMemo(
    () => arrangements.filter((a) => !a.archived_at || collapsingIds.has(a.id)),
    [arrangements, collapsingIds],
  );
  const archived = useMemo(
    () => arrangements.filter((a) => a.archived_at && !collapsingIds.has(a.id)),
    [arrangements, collapsingIds],
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = visible.findIndex((a) => a.id === active.id);
    const newIndex = visible.findIndex((a) => a.id === over.id);
    const reordered = arrayMove(visible, oldIndex, newIndex);
    setArrangements([...reordered, ...archived]);
    startTransition(() => reorderArrangements(reordered.map((a) => a.id)));
  }

  async function handleArchive(id: string) {
    await archiveArrangement(id);
    setArrangements((prev) => prev.map((a) => (a.id === id ? { ...a, archived_at: new Date().toISOString() } : a)));
    setCollapsingIds((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setCollapsingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, COLLAPSE_MS);
  }

  function handleUnarchive(id: string) {
    startTransition(async () => {
      await unarchiveArrangement(id);
      setArrangements((prev) => prev.map((a) => (a.id === id ? { ...a, archived_at: null } : a)));
    });
  }

  async function handleDuplicate(id: string) {
    await duplicateArrangement(id);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-ink-400">Aanbod</p>
          <h2 className="font-display text-2xl font-semibold text-ink-500">Arrangementen</h2>
        </div>
        <ButtonLink href="/dashboard/arrangementen/nieuw" data-faq-id="new-arrangement-button">
          <Plus className="size-4" /> Nieuw arrangement
        </ButtonLink>
      </div>

      {visible.length === 0 ? (
        <Card data-faq-id="arrangementen-grid" className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
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
            <div
              data-faq-id="arrangementen-grid"
              className="grid grid-cols-1 gap-4 [perspective:800px] sm:grid-cols-2 xl:grid-cols-3"
            >
              {visible.map((arrangement) => (
                <SortableCard
                  key={arrangement.id}
                  arrangement={arrangement}
                  collapsed={collapsingIds.has(arrangement.id)}
                  onArchive={() => handleArchive(arrangement.id)}
                  onDuplicate={() => handleDuplicate(arrangement.id)}
                />
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
            <div className="grid grid-cols-1 gap-4 [perspective:800px] sm:grid-cols-2 xl:grid-cols-3">
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
