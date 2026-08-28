import type { TextBlockContent } from "@/lib/blocks/types";
import { Field, TextInput } from "@/components/builder/field";
import { RichTextEditor } from "@/components/builder/rich-text-editor";

export function TextBlockEditor({
  content,
  onChange,
}: {
  content: TextBlockContent;
  onChange: (content: TextBlockContent) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Field label="Titel">
        <TextInput
          value={content.heading}
          onChange={(e) => onChange({ ...content, heading: e.target.value })}
          placeholder="bijv. Over ons"
        />
      </Field>
      <Field label="Tekst">
        <RichTextEditor
          value={content.html}
          onChange={(html) => onChange({ ...content, html })}
        />
      </Field>
    </div>
  );
}
