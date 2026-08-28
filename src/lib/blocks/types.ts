import type { BlockType } from "@/lib/types/database";

export type CoverBlockContent = {
  heroImageUrl: string;
  eyebrow: string;
  eventDateLabel: string;
};

export type TextBlockContent = {
  heading: string;
  html: string;
};

export type GalleryImage = { id: string; url: string; caption: string };
export type GalleryBlockContent = {
  heading: string;
  images: GalleryImage[];
};

export type PackageAddon = {
  id: string;
  packageId: string | null;
  name: string;
  description: string;
  price: number;
  quantityEditable: boolean;
  defaultQuantity: number;
};

export type PackageDraft = {
  id: string;
  name: string;
  description: string;
  photoUrl: string;
  price: number;
  isDefaultSelected: boolean;
};

export type PackagesBlockContent = {
  heading: string;
  intro: string;
  packages: PackageDraft[];
  addons: PackageAddon[];
};

export type TimelineItem = { id: string; time: string; title: string; description: string };
export type TimelineBlockContent = {
  heading: string;
  items: TimelineItem[];
};

export type TermsBlockContent = {
  heading: string;
  html: string;
};

export type SignatureBlockContent = {
  heading: string;
  intro: string;
};

export type BlockContent =
  | CoverBlockContent
  | TextBlockContent
  | GalleryBlockContent
  | PackagesBlockContent
  | TimelineBlockContent
  | TermsBlockContent
  | SignatureBlockContent;

/** In-memory representatie van een blok, gebruikt door zowel de template- als
 * offerte-editor. `id` is een uuid (bestaand) of een client-side tijdelijke
 * id (nieuw, wordt bij opslaan vervangen). */
export type BlockDraft = {
  id: string;
  type: BlockType;
  position: number;
  content: Record<string, unknown>;
  /** Vertaalde (EN) content, samengesteld uit content_en; null als nog niet vertaald. */
  contentEn?: Record<string, unknown> | null;
  isNew?: boolean;
};

export const BLOCK_LABELS: Record<BlockType, string> = {
  cover: "Cover / intro",
  text: "Tekstblok",
  gallery: "Fotogalerij",
  packages: "Pakketten & prijzen",
  timeline: "Tijdlijn",
  terms: "Voorwaarden",
  signature: "Handtekening",
};

export const BLOCK_ORDER: BlockType[] = [
  "cover",
  "text",
  "gallery",
  "packages",
  "timeline",
  "terms",
  "signature",
];

function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `tmp-${Math.random().toString(36).slice(2)}`;
}

export function defaultContentFor(type: BlockType): Record<string, unknown> {
  switch (type) {
    case "cover":
      return {
        heroImageUrl: "",
        eyebrow: "Persoonlijke offerte voor",
        eventDateLabel: "",
      } satisfies CoverBlockContent;
    case "text":
      return {
        heading: "Over ons",
        html: "<p>Vertel hier iets over jullie aanpak of over Feest aan het Water.</p>",
      } satisfies TextBlockContent;
    case "gallery":
      return { heading: "Sfeerbeelden", images: [] } satisfies GalleryBlockContent;
    case "packages":
      return {
        heading: "Pakketten & prijzen",
        intro: "",
        packages: [],
        addons: [],
      } satisfies PackagesBlockContent;
    case "timeline":
      return { heading: "Planning op de dag", items: [] } satisfies TimelineBlockContent;
    case "terms":
      return {
        heading: "Voorwaarden",
        html: "<p>Vul hier de voorwaarden en kleine lettertjes in.</p>",
      } satisfies TermsBlockContent;
    case "signature":
      return {
        heading: "Akkoord & ondertekenen",
        intro: "Ga akkoord met deze offerte en onderteken direct digitaal.",
      } satisfies SignatureBlockContent;
  }
}

export function newBlock(type: BlockType, position: number): BlockDraft {
  return { id: uid(), type, position, content: defaultContentFor(type), isNew: true };
}

export function newPackage(): PackageDraft {
  return {
    id: uid(),
    name: "Nieuw pakket",
    description: "",
    photoUrl: "",
    price: 0,
    isDefaultSelected: false,
  };
}

export function newAddon(packageId: string | null = null): PackageAddon {
  return {
    id: uid(),
    packageId,
    name: "Nieuwe optie",
    description: "",
    price: 0,
    quantityEditable: false,
    defaultQuantity: 1,
  };
}

export function newGalleryImage(): GalleryImage {
  return { id: uid(), url: "", caption: "" };
}

export function newTimelineItem(): TimelineItem {
  return { id: uid(), time: "", title: "", description: "" };
}
