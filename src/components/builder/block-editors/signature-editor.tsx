import type { SignatureBlockContent } from "@/lib/blocks/types";
import { Field, TextInput, TextArea } from "@/components/builder/field";

export function SignatureBlockEditor({
  content,
  onChange,
}: {
  content: SignatureBlockContent;
  onChange: (content: SignatureBlockContent) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Field label="Titel">
        <TextInput
          value={content.heading}
          onChange={(e) => onChange({ ...content, heading: e.target.value })}
        />
      </Field>
      <Field label="Introtekst">
        <TextArea
          value={content.intro}
          onChange={(e) => onChange({ ...content, intro: e.target.value })}
        />
      </Field>
      <p className="rounded-brand-sm bg-blue-50 px-3.5 py-2.5 text-xs text-blue-700">
        De handtekening-flow zelf (canvas, audit-trail, PDF-certificaat) wordt
        gebouwd in Fase 4. Dit blok bepaalt alleen hoe de sectie eruitziet.
      </p>
    </div>
  );
}
