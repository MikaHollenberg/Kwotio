"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Plus, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DecimalField } from "@/components/ui/decimal-field";
import { SegmentedToggle } from "@/components/ui/segmented-toggle";
import { ImageUploadField } from "@/components/builder/image-upload-field";
import { ARRANGEMENT_COLOR_PRESETS } from "@/lib/arrangements/colors";
import { ARRANGEMENT_ICON_GROUPS, ARRANGEMENT_ICON_MAP } from "@/lib/arrangements/icons";
import { cn } from "@/lib/utils";
import type { ArrangementContentItem, ArrangementContentItemType, ArrangementInclusiefItem, ArrangementExtra } from "@/lib/arrangements/types";

function uid() {
  return crypto.randomUUID();
}

const TYPE_LABELS: Record<ArrangementContentItemType, string> = {
  text: "Tekst",
  category: "Categorie",
  extras: "Extra's",
  image: "Afbeelding",
  highlight: "Actievak",
};

/** Sneltoetsen voor veelgebruikte breuken, bovenop de losse -/+ stappen
 * hieronder -- samen geven ze de volledige 1-12-vrijheid (elke twaalfde
 * apart instelbaar) zonder dat je voor een gewone 1/3 of 3/4 eerst moet
 * uitrekenen welk getal dat is. */
const WIDTH_PRESETS: { value: number; label: string }[] = [
  { value: 3, label: "1/4" },
  { value: 4, label: "1/3" },
  { value: 6, label: "1/2" },
  { value: 8, label: "2/3" },
  { value: 9, label: "3/4" },
  { value: 12, label: "Vol" },
];

function clampWidth(value: number) {
  return Math.min(12, Math.max(1, Math.round(value)));
}

const EXTRA_UNIT_OPTIONS: { value: ArrangementExtra["unit"]; label: string }[] = [
  { value: "vast", label: "vast bedrag" },
  { value: "p.p.", label: "per persoon" },
];

function defaultItemFor(type: ArrangementContentItemType): ArrangementContentItem {
  const base = { id: uid(), width: 6, color: null, icon: null };
  switch (type) {
    case "text":
      return { ...base, type: "text", title: "Nieuw tekstblok", body: "" };
    case "category":
      return { ...base, type: "category", title: "Nieuwe categorie", items: [] };
    case "extras":
      return { ...base, type: "extras", title: "Nieuwe extra's", items: [] };
    case "image":
      return { ...base, type: "image", imageUrl: "", caption: "" };
    case "highlight":
      return { ...base, type: "highlight", title: "Nieuw actievak", body: "" };
  }
}

function IconSwatch({ iconKey, color, size = 32 }: { iconKey: string | null; color: string; size?: number }) {
  const Icon = iconKey ? ARRANGEMENT_ICON_MAP[iconKey] : undefined;
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-brand-sm"
      style={{ width: size, height: size, backgroundColor: `${color}1a`, color }}
    >
      {Icon ? <Icon className="size-4" /> : <Palette className="size-4 opacity-50" />}
    </div>
  );
}

function IconPicker({
  value,
  color,
  onChange,
  onClose,
}: {
  value: string | null;
  color: string;
  onChange: (icon: string | null) => void;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col gap-2.5 rounded-brand-sm bg-sand-100 p-3">
      <button
        type="button"
        onClick={() => {
          onChange(null);
          onClose();
        }}
        className={cn(
          "flex w-fit items-center gap-1.5 rounded-brand-sm px-2 py-1 text-xs font-medium text-ink-400 hover:bg-sand-200",
          value === null && "bg-white text-ink-500 shadow-sm",
        )}
      >
        Geen icoon
      </button>
      {ARRANGEMENT_ICON_GROUPS.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-300">{group.label}</span>
          <div className="flex flex-wrap gap-1.5">
            {group.icons.map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                title={label}
                onClick={() => {
                  onChange(key);
                  onClose();
                }}
                className={cn(
                  "flex size-8 items-center justify-center rounded-brand-sm border transition-colors duration-150 ease-brand",
                  value === key ? "border-transparent" : "border-transparent bg-white text-ink-400 hover:bg-sand-200",
                )}
                style={value === key ? { backgroundColor: `${color}1a`, color, boxShadow: `inset 0 0 0 1.5px ${color}` } : undefined}
              >
                <Icon className="size-4" />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ColorPicker({
  value,
  defaultColor,
  onChange,
}: {
  value: string | null;
  defaultColor: string;
  onChange: (color: string | null) => void;
}) {
  const [customOpen, setCustomOpen] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        onClick={() => onChange(null)}
        title="Arrangementkleur"
        className={cn(
          "flex size-6 items-center justify-center rounded-full border-2 border-dashed",
          value === null ? "border-ink-500" : "border-ink-200",
        )}
        style={{ backgroundColor: `${defaultColor}33` }}
      />
      {ARRANGEMENT_COLOR_PRESETS.map((hex) => (
        <button
          key={hex}
          type="button"
          onClick={() => {
            onChange(hex);
            setCustomOpen(false);
          }}
          aria-label={hex}
          className={cn("size-6 rounded-full", value === hex && "ring-2 ring-offset-1 ring-ink-400")}
          style={{ backgroundColor: hex }}
        />
      ))}
      <button
        type="button"
        onClick={() => setCustomOpen((v) => !v)}
        className={cn(
          "flex size-6 items-center justify-center rounded-full border border-dashed border-ink-300 text-[9px] font-semibold text-ink-400 hover:border-ink-400",
          customOpen && "ring-2 ring-offset-1 ring-ink-400",
        )}
      >
        +
      </button>
      {customOpen && (
        <input
          type="color"
          value={value ?? defaultColor}
          onChange={(e) => onChange(e.target.value)}
          className="size-6 cursor-pointer rounded-full border-0 bg-transparent"
        />
      )}
    </div>
  );
}

function CategoryItemsEditor({
  items,
  onChange,
}: {
  items: ArrangementInclusiefItem[];
  onChange: (items: ArrangementInclusiefItem[]) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-1.5">
          <input
            value={item.text}
            onChange={(e) => onChange(items.map((it) => (it.id === item.id ? { ...it, text: e.target.value } : it)))}
            placeholder="Heineken tapbier"
            className="h-8 flex-1 rounded-brand-sm border border-ink-200 bg-white px-2 text-xs text-ink-500 outline-none focus:border-teal-500"
          />
          <input
            value={item.note}
            onChange={(e) => onChange(items.map((it) => (it.id === item.id ? { ...it, note: e.target.value } : it)))}
            placeholder="toelichting (optioneel)"
            className="h-8 w-32 rounded-brand-sm border border-ink-200 bg-white px-2 text-xs text-ink-400 outline-none focus:border-teal-500"
          />
          <button
            type="button"
            onClick={() => onChange(items.filter((it) => it.id !== item.id))}
            className="flex size-7 shrink-0 items-center justify-center rounded-brand-sm text-ink-300 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, { id: uid(), text: "", note: "" }])}
        className="mt-1 w-fit text-xs font-semibold text-orange-600 hover:text-orange-700"
      >
        + Item toevoegen
      </button>
    </div>
  );
}

function ExtrasItemsEditor({ items, onChange }: { items: ArrangementExtra[]; onChange: (items: ArrangementExtra[]) => void }) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((extra) => (
        <div key={extra.id} className="flex flex-wrap items-center gap-1.5">
          <input
            value={extra.name}
            onChange={(e) => onChange(items.map((it) => (it.id === extra.id ? { ...it, name: e.target.value } : it)))}
            placeholder="DJ inhuren"
            className="h-9 flex-1 rounded-brand-sm border border-ink-200 bg-white px-2.5 text-xs text-ink-500 outline-none focus:border-teal-500"
          />
          <DecimalField
            value={extra.price}
            onCommit={(v) => onChange(items.map((it) => (it.id === extra.id ? { ...it, price: v } : it)))}
            className="h-9 w-24 rounded-brand-sm border border-ink-200 bg-white px-2.5 text-xs text-ink-500 outline-none focus:border-teal-500"
          />
          <SegmentedToggle
            value={extra.unit}
            options={EXTRA_UNIT_OPTIONS}
            onChange={(unit) => onChange(items.map((it) => (it.id === extra.id ? { ...it, unit } : it)))}
          />
          <button
            type="button"
            onClick={() => onChange(items.filter((it) => it.id !== extra.id))}
            className="flex size-7 shrink-0 items-center justify-center rounded-brand-sm text-ink-300 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, { id: uid(), name: "", price: 0, unit: "vast" }])}
        className="w-fit text-xs font-semibold text-orange-600 hover:text-orange-700"
      >
        + Extra toevoegen
      </button>
    </div>
  );
}

function ContentItemCard({
  item,
  defaultColor,
  organizationId,
  onChange,
  onRemove,
}: {
  item: ArrangementContentItem;
  defaultColor: string;
  organizationId: string;
  onChange: (item: ArrangementContentItem) => void;
  onRemove: () => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    transition: { duration: 300, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
  });
  const effectiveColor = item.color ?? defaultColor;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 }}
      className="flex flex-col gap-3 rounded-brand-sm border border-ink-200 bg-white p-3.5"
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="flex size-7 shrink-0 cursor-grab items-center justify-center rounded-brand-sm text-ink-300 hover:bg-sand-200 hover:text-ink-500 active:cursor-grabbing"
        >
          <GripVertical className="size-4" />
        </button>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-300">{TYPE_LABELS[item.type]}</span>
        <span className="flex-1" />
        <button
          type="button"
          onClick={onRemove}
          aria-label="Onderdeel verwijderen"
          className="flex size-7 shrink-0 items-center justify-center rounded-brand-sm text-ink-300 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      <div className="flex items-start gap-3">
        {item.type !== "image" && (
          <button type="button" onClick={() => setPickerOpen((v) => !v)}>
            <IconSwatch iconKey={item.icon} color={effectiveColor} />
          </button>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {item.type === "image" ? (
            <>
              <ImageUploadField
                value={item.imageUrl}
                onChange={(url) => onChange({ ...item, imageUrl: url })}
                organizationId={organizationId}
                aspect="aspect-video"
                label="Afbeelding"
              />
              <input
                value={item.caption}
                onChange={(e) => onChange({ ...item, caption: e.target.value })}
                placeholder="Onderschrift (optioneel)"
                className="h-9 rounded-brand-sm border border-ink-200 bg-white px-2.5 text-xs text-ink-500 outline-none focus:border-teal-500"
              />
            </>
          ) : (
            <input
              value={item.title}
              onChange={(e) => onChange({ ...item, title: e.target.value } as ArrangementContentItem)}
              placeholder="Titel"
              className="h-9 rounded-brand-sm border border-ink-200 bg-white px-2.5 text-sm font-medium text-ink-500 outline-none focus:border-teal-500"
            />
          )}

          {(item.type === "text" || item.type === "highlight") && (
            <textarea
              value={item.body}
              onChange={(e) => onChange({ ...item, body: e.target.value })}
              rows={3}
              placeholder="Schrijf hier je tekst..."
              className="rounded-brand-sm border border-ink-200 bg-white px-2.5 py-2 text-xs text-ink-500 outline-none focus:border-teal-500"
            />
          )}
          {item.type === "category" && (
            <CategoryItemsEditor items={item.items} onChange={(items) => onChange({ ...item, items })} />
          )}
          {item.type === "extras" && (
            <ExtrasItemsEditor items={item.items} onChange={(items) => onChange({ ...item, items })} />
          )}
        </div>
      </div>

      {pickerOpen && item.type !== "image" && (
        <IconPicker
          value={item.icon}
          color={effectiveColor}
          onChange={(icon) => onChange({ ...item, icon })}
          onClose={() => setPickerOpen(false)}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-3">
        {item.type !== "image" ? (
          <ColorPicker value={item.color} defaultColor={defaultColor} onChange={(color) => onChange({ ...item, color })} />
        ) : (
          <span />
        )}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-ink-300">Breedte</span>
          <div className="flex items-center gap-0.5 rounded-brand-sm border border-ink-200 bg-white">
            <button
              type="button"
              onClick={() => onChange({ ...item, width: clampWidth(item.width - 1) })}
              disabled={item.width <= 1}
              aria-label="Smaller"
              className="flex h-7 w-6 items-center justify-center text-ink-400 hover:bg-sand-200 disabled:opacity-30"
            >
              −
            </button>
            <span className="w-9 text-center text-[11px] font-semibold text-ink-500">{item.width}/12</span>
            <button
              type="button"
              onClick={() => onChange({ ...item, width: clampWidth(item.width + 1) })}
              disabled={item.width >= 12}
              aria-label="Breder"
              className="flex h-7 w-6 items-center justify-center text-ink-400 hover:bg-sand-200 disabled:opacity-30"
            >
              +
            </button>
          </div>
          <div className="flex items-center gap-1">
            {WIDTH_PRESETS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ ...item, width: opt.value })}
                className={cn(
                  "flex h-7 items-center justify-center rounded-brand-sm px-2 text-[11px] font-semibold transition-colors duration-150 ease-brand",
                  item.width === opt.value ? "bg-ink-500 text-white" : "border border-ink-200 bg-white text-ink-400 hover:border-ink-300",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ArrangementContentEditor({
  items,
  onChange,
  defaultColor,
  organizationId,
}: {
  items: ArrangementContentItem[];
  onChange: (items: ArrangementContentItem[]) => void;
  defaultColor: string;
  organizationId: string;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    onChange(arrayMove(items, oldIndex, newIndex));
  }

  return (
    <div className="flex flex-col gap-3">
      {items.length === 0 && (
        <p className="rounded-brand-sm border border-dashed border-ink-200 px-4 py-6 text-center text-sm text-ink-400">
          Nog geen onderdelen. Voeg hieronder je eerste tekst, categorie, extra&rsquo;s, afbeelding of actievak toe.
        </p>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <ContentItemCard
                key={item.id}
                item={item}
                defaultColor={defaultColor}
                organizationId={organizationId}
                onChange={(updated) => onChange(items.map((i) => (i.id === updated.id ? updated : i)))}
                onRemove={() => onChange(items.filter((i) => i.id !== item.id))}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(TYPE_LABELS) as ArrangementContentItemType[]).map((type) => (
          <Button key={type} variant="outline" size="sm" onClick={() => onChange([...items, defaultItemFor(type)])}>
            <Plus className="size-3.5" /> {TYPE_LABELS[type]}
          </Button>
        ))}
      </div>
    </div>
  );
}
