import { Plus, Trash2 } from "lucide-react";
import type { GalleryBlockContent } from "@/lib/blocks/types";
import { newGalleryImage } from "@/lib/blocks/types";
import { Field, TextInput } from "@/components/builder/field";
import { ImageUploadField } from "@/components/builder/image-upload-field";
import { Button } from "@/components/ui/button";

export function GalleryBlockEditor({
  content,
  onChange,
  organizationId,
}: {
  content: GalleryBlockContent;
  onChange: (content: GalleryBlockContent) => void;
  organizationId: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Field label="Titel">
        <TextInput
          value={content.heading}
          onChange={(e) => onChange({ ...content, heading: e.target.value })}
          placeholder="bijv. Sfeerbeelden"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {content.images.map((image, i) => (
          <div key={image.id} className="flex flex-col gap-1.5">
            <ImageUploadField
              value={image.url}
              onChange={(url) => {
                const images = [...content.images];
                images[i] = { ...image, url };
                onChange({ ...content, images });
              }}
              organizationId={organizationId}
              aspect="aspect-square"
            />
            <div className="flex items-center gap-1">
              <TextInput
                value={image.caption}
                onChange={(e) => {
                  const images = [...content.images];
                  images[i] = { ...image, caption: e.target.value };
                  onChange({ ...content, images });
                }}
                placeholder="Bijschrift (optioneel)"
                className="h-8 flex-1 text-xs"
              />
              <button
                type="button"
                onClick={() =>
                  onChange({ ...content, images: content.images.filter((img) => img.id !== image.id) })
                }
                className="flex size-8 shrink-0 items-center justify-center rounded-brand-sm text-ink-300 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() => onChange({ ...content, images: [...content.images, newGalleryImage()] })}
      >
        <Plus className="size-4" /> Foto toevoegen
      </Button>
    </div>
  );
}
