import { Plus, Trash2, GripVertical } from "lucide-react";
import type { TimelineBlockContent } from "@/lib/blocks/types";
import { newTimelineItem } from "@/lib/blocks/types";
import { Field, TextInput, TextArea } from "@/components/builder/field";
import { Button } from "@/components/ui/button";

export function TimelineBlockEditor({
  content,
  onChange,
}: {
  content: TimelineBlockContent;
  onChange: (content: TimelineBlockContent) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Field label="Titel">
        <TextInput
          value={content.heading}
          onChange={(e) => onChange({ ...content, heading: e.target.value })}
          placeholder="bijv. Planning op de dag"
        />
      </Field>

      <div className="flex flex-col gap-3">
        {content.items.map((item, i) => (
          <div key={item.id} className="flex gap-3 rounded-brand-sm border border-ink-100 bg-sand-50 p-3">
            <GripVertical className="mt-2.5 size-4 shrink-0 text-ink-200" />
            <div className="grid flex-1 grid-cols-[100px_1fr] gap-2">
              <TextInput
                value={item.time}
                onChange={(e) => {
                  const items = [...content.items];
                  items[i] = { ...item, time: e.target.value };
                  onChange({ ...content, items });
                }}
                placeholder="14:00"
              />
              <TextInput
                value={item.title}
                onChange={(e) => {
                  const items = [...content.items];
                  items[i] = { ...item, title: e.target.value };
                  onChange({ ...content, items });
                }}
                placeholder="Ontvangst & welkomstdrankje"
              />
              <TextArea
                value={item.description}
                onChange={(e) => {
                  const items = [...content.items];
                  items[i] = { ...item, description: e.target.value };
                  onChange({ ...content, items });
                }}
                placeholder="Toelichting (optioneel)"
                className="col-span-2 min-h-14"
              />
            </div>
            <button
              type="button"
              onClick={() => onChange({ ...content, items: content.items.filter((it) => it.id !== item.id) })}
              className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-brand-sm text-ink-300 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() => onChange({ ...content, items: [...content.items, newTimelineItem()] })}
      >
        <Plus className="size-4" /> Onderdeel toevoegen
      </Button>
    </div>
  );
}
