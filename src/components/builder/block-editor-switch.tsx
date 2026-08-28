import type { BlockDraft } from "@/lib/blocks/types";
import type {
  CoverBlockContent,
  TextBlockContent,
  GalleryBlockContent,
  PackagesBlockContent,
  TimelineBlockContent,
  SignatureBlockContent,
} from "@/lib/blocks/types";
import { CoverBlockEditor } from "@/components/builder/block-editors/cover-editor";
import { TextBlockEditor } from "@/components/builder/block-editors/text-editor";
import { GalleryBlockEditor } from "@/components/builder/block-editors/gallery-editor";
import { PackagesBlockEditor } from "@/components/builder/block-editors/packages-editor";
import { TimelineBlockEditor } from "@/components/builder/block-editors/timeline-editor";
import { SignatureBlockEditor } from "@/components/builder/block-editors/signature-editor";

export function BlockEditorSwitch({
  block,
  onChange,
  organizationId,
}: {
  block: BlockDraft;
  onChange: (content: Record<string, unknown>) => void;
  organizationId: string;
}) {
  switch (block.type) {
    case "cover":
      return (
        <CoverBlockEditor
          content={block.content as CoverBlockContent}
          onChange={onChange}
          organizationId={organizationId}
        />
      );
    case "text":
    case "terms":
      return (
        <TextBlockEditor
          content={block.content as TextBlockContent}
          onChange={onChange}
        />
      );
    case "gallery":
      return (
        <GalleryBlockEditor
          content={block.content as GalleryBlockContent}
          onChange={onChange}
          organizationId={organizationId}
        />
      );
    case "packages":
      return (
        <PackagesBlockEditor
          content={block.content as PackagesBlockContent}
          onChange={onChange}
          organizationId={organizationId}
        />
      );
    case "timeline":
      return (
        <TimelineBlockEditor
          content={block.content as TimelineBlockContent}
          onChange={onChange}
        />
      );
    case "signature":
      return (
        <SignatureBlockEditor
          content={block.content as SignatureBlockContent}
          onChange={onChange}
        />
      );
  }
}
