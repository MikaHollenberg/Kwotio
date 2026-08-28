import "server-only";
import type {
  BlockDraft,
  CoverBlockContent,
  TextBlockContent,
  GalleryBlockContent,
  PackagesBlockContent,
  TimelineBlockContent,
  SignatureBlockContent,
} from "@/lib/blocks/types";
import { translateTexts, type TranslateResult } from "./anthropic-translate";

type Overlay = Record<string, unknown>;

function push(texts: string[], value: string): number {
  if (!value || !value.trim()) return -1;
  texts.push(value);
  return texts.length - 1;
}

function at(t: string[], i: number): string | undefined {
  return i >= 0 ? t[i] : undefined;
}

/**
 * Verzamelt alle vertaalbare velden van alle blokken in één platte lijst
 * (voor één enkele Claude-aanroep) en levert per blok een "recipe" die de
 * vertaalde lijst terugvertaalt naar de overlay-vorm die content_en
 * verwacht (zie plan: geadresseerd op id, niet op array-index).
 */
export async function buildTranslatedOverlays(
  blocks: BlockDraft[],
): Promise<{ ok: true; overlays: Overlay[] } | Exclude<TranslateResult, { ok: true }>> {
  const texts: string[] = [];
  const builders: ((t: string[]) => Overlay)[] = [];

  for (const block of blocks) {
    switch (block.type) {
      case "cover": {
        const c = block.content as CoverBlockContent;
        const eyebrowIdx = push(texts, c.eyebrow);
        const dateIdx = push(texts, c.eventDateLabel);
        builders.push((t) => ({
          ...(at(t, eyebrowIdx) !== undefined ? { eyebrow: at(t, eyebrowIdx) } : {}),
          ...(at(t, dateIdx) !== undefined ? { eventDateLabel: at(t, dateIdx) } : {}),
        }));
        break;
      }

      case "text":
      case "terms": {
        const c = block.content as TextBlockContent;
        const headingIdx = push(texts, c.heading);
        const htmlIdx = push(texts, c.html);
        builders.push((t) => ({
          ...(at(t, headingIdx) !== undefined ? { heading: at(t, headingIdx) } : {}),
          ...(at(t, htmlIdx) !== undefined ? { html: at(t, htmlIdx) } : {}),
        }));
        break;
      }

      case "gallery": {
        const c = block.content as GalleryBlockContent;
        const headingIdx = push(texts, c.heading);
        const imageIdxs = c.images.map((img) => push(texts, img.caption));
        builders.push((t) => ({
          ...(at(t, headingIdx) !== undefined ? { heading: at(t, headingIdx) } : {}),
          images: Object.fromEntries(
            c.images
              .map((img, i) => [img.id, at(t, imageIdxs[i])] as const)
              .filter(([, caption]) => caption !== undefined),
          ),
        }));
        break;
      }

      case "packages": {
        const c = block.content as PackagesBlockContent;
        const headingIdx = push(texts, c.heading);
        const introIdx = push(texts, c.intro);
        const pkgIdxs = c.packages.map((p) => ({
          name: push(texts, p.name),
          description: push(texts, p.description),
        }));
        const addonIdxs = c.addons.map((a) => ({
          name: push(texts, a.name),
          description: push(texts, a.description),
        }));
        builders.push((t) => ({
          ...(at(t, headingIdx) !== undefined ? { heading: at(t, headingIdx) } : {}),
          ...(at(t, introIdx) !== undefined ? { intro: at(t, introIdx) } : {}),
          packages: Object.fromEntries(
            c.packages.map((p, i) => [
              p.id,
              {
                ...(at(t, pkgIdxs[i].name) !== undefined ? { name: at(t, pkgIdxs[i].name) } : {}),
                ...(at(t, pkgIdxs[i].description) !== undefined
                  ? { description: at(t, pkgIdxs[i].description) }
                  : {}),
              },
            ]),
          ),
          addons: Object.fromEntries(
            c.addons.map((a, i) => [
              a.id,
              {
                ...(at(t, addonIdxs[i].name) !== undefined ? { name: at(t, addonIdxs[i].name) } : {}),
                ...(at(t, addonIdxs[i].description) !== undefined
                  ? { description: at(t, addonIdxs[i].description) }
                  : {}),
              },
            ]),
          ),
        }));
        break;
      }

      case "timeline": {
        const c = block.content as TimelineBlockContent;
        const headingIdx = push(texts, c.heading);
        const itemIdxs = c.items.map((item) => ({
          title: push(texts, item.title),
          description: push(texts, item.description),
        }));
        builders.push((t) => ({
          ...(at(t, headingIdx) !== undefined ? { heading: at(t, headingIdx) } : {}),
          items: Object.fromEntries(
            c.items.map((item, i) => [
              item.id,
              {
                ...(at(t, itemIdxs[i].title) !== undefined ? { title: at(t, itemIdxs[i].title) } : {}),
                ...(at(t, itemIdxs[i].description) !== undefined
                  ? { description: at(t, itemIdxs[i].description) }
                  : {}),
              },
            ]),
          ),
        }));
        break;
      }

      case "signature": {
        const c = block.content as SignatureBlockContent;
        const headingIdx = push(texts, c.heading);
        const introIdx = push(texts, c.intro);
        builders.push((t) => ({
          ...(at(t, headingIdx) !== undefined ? { heading: at(t, headingIdx) } : {}),
          ...(at(t, introIdx) !== undefined ? { intro: at(t, introIdx) } : {}),
        }));
        break;
      }
    }
  }

  const result = await translateTexts(texts);
  if (!result.ok) return result;

  return { ok: true, overlays: builders.map((build) => build(result.translations)) };
}
