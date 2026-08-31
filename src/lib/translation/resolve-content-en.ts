import "server-only";
import type { BlockType } from "@/lib/types/database";
import type { GalleryBlockContent, PackagesBlockContent, TimelineBlockContent } from "@/lib/blocks/types";

/**
 * Merget de compacte content_en-overlay (alleen vertaalde tekstvelden,
 * geadresseerd op id) met de gewone content tot een volledige contentEn in
 * dezelfde vorm als content. Retourneert null als er nog geen vertaling is —
 * consumenten vallen dan terug op content.
 */
export function mergeContentEn(
  type: BlockType,
  content: Record<string, unknown>,
  overlay: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!overlay) return null;

  switch (type) {
    case "cover":
    case "text":
    case "terms":
    case "signature":
      return { ...content, ...overlay };

    case "gallery": {
      const c = content as GalleryBlockContent;
      const captions = (overlay.images ?? {}) as Record<string, string>;
      return {
        heading: (overlay.heading as string) ?? c.heading,
        images: c.images.map((img) => ({ ...img, caption: captions[img.id] ?? img.caption })),
      };
    }

    case "timeline": {
      const c = content as TimelineBlockContent;
      const items = (overlay.items ?? {}) as Record<string, { title?: string; description?: string }>;
      return {
        heading: (overlay.heading as string) ?? c.heading,
        items: c.items.map((item) => ({ ...item, ...items[item.id] })),
      };
    }

    case "packages": {
      const c = content as PackagesBlockContent;
      const packages = (overlay.packages ?? {}) as Record<string, { name?: string; description?: string }>;
      const addons = (overlay.addons ?? {}) as Record<string, { name?: string; description?: string }>;
      return {
        heading: (overlay.heading as string) ?? c.heading,
        intro: (overlay.intro as string) ?? c.intro,
        packages: c.packages.map((p) => ({ ...p, ...packages[p.id] })),
        addons: c.addons.map((a) => ({ ...a, ...addons[a.id] })),
        pdfUrl: c.pdfUrl,
        pdfUrl2: c.pdfUrl2,
        maxSelections: c.maxSelections,
      };
    }

    default:
      return null;
  }
}
