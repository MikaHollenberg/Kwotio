import type { CoverBlockContent } from "@/lib/blocks/types";
import { Field, TextInput } from "@/components/builder/field";
import { ImageUploadField } from "@/components/builder/image-upload-field";

export function CoverBlockEditor({
  content,
  onChange,
  organizationId,
}: {
  content: CoverBlockContent;
  onChange: (content: CoverBlockContent) => void;
  organizationId: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Field label="Hero-foto">
        <ImageUploadField
          value={content.heroImageUrl}
          onChange={(url) => onChange({ ...content, heroImageUrl: url })}
          organizationId={organizationId}
          aspect="aspect-[16/9]"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Kicker-tekst">
          <TextInput
            value={content.eyebrow}
            onChange={(e) => onChange({ ...content, eyebrow: e.target.value })}
            placeholder="Persoonlijke offerte voor"
          />
        </Field>
        <Field label="Datumlabel (optioneel)">
          <TextInput
            value={content.eventDateLabel}
            onChange={(e) => onChange({ ...content, eventDateLabel: e.target.value })}
            placeholder="bijv. Zomer 2026"
          />
        </Field>
      </div>
      <p className="text-xs text-ink-400">
        Offertetitel, klantnaam en eventdatum komen automatisch uit de
        gegevens bovenaan de offerte.
      </p>
    </div>
  );
}
