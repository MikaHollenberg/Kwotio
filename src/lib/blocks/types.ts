import type { BlockType, ArrangementPricingMode } from "@/lib/types/database";
import type { ArrangementContentItem } from "@/lib/arrangements/types";

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
  /** Tot twee PDF-bijlagen voor het hele blok (bijv. een menukaart), niet per pakket.
   * pdfLabel/pdfLabel2 zijn optionele namen ervoor (bijv. "Menukaart"), zodat de
   * klant weet wat hij opent — leeg valt terug op een generieke "Download bijlage". */
  pdfUrl: string;
  pdfUrl2: string;
  pdfLabel: string;
  pdfLabel2: string;
  /** Hoeveel pakketten de klant tegelijk mag kiezen binnen dit blok. */
  maxSelections: 1 | 2;
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

/**
 * Momentopname van één arrangement uit de catalogus (lib/arrangements/),
 * gekopieerd naar de offerte op het moment dat het wordt toegevoegd — geen
 * live koppeling, zelfde principe als een blok-template. `arrangementId`
 * blijft staan als referentie (puur informatief, geen foreign key op
 * blok-niveau). `basePrice`/`priceLabel` zijn de op importmoment berekende
 * prijs (via calculateArrangementPrice(), o.b.v. de datum/het aantal
 * personen van de offerte op dat moment) — verandert niet vanzelf mee als
 * het arrangement of de offerte later wijzigt.
 */
export type ArrangementBlockContent = {
  heading: string;
  arrangementId: string;
  name: string;
  description: string;
  colorCode: string;
  pricingMode: ArrangementPricingMode;
  basePrice: number;
  priceLabel: string | null;
  contentItems: ArrangementContentItem[];
  pdfUrl: string | null;
};

export type BlockContent =
  | CoverBlockContent
  | TextBlockContent
  | GalleryBlockContent
  | PackagesBlockContent
  | TimelineBlockContent
  | TermsBlockContent
  | SignatureBlockContent
  | ArrangementBlockContent;

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
  arrangement: "Arrangement",
};

export const BLOCK_ICONS: Record<BlockType, string> = {
  cover: "🖼️",
  text: "📝",
  gallery: "🌴",
  packages: "💶",
  timeline: "🕒",
  terms: "📄",
  signature: "✍️",
  arrangement: "🍹",
};

/**
 * Bloktypes die via "Blok toevoegen" te kiezen zijn. "terms" en "signature"
 * staan hier bewust niet meer in: de voorwaarden-zin (met link naar de
 * geüploade PDF, zie app/src/lib/legal.ts) en de akkoord-en-onderteken-knop
 * staan al altijd automatisch op de offertepagina, dus die twee blokken
 * voegden niets toe (op verzoek van de gebruiker verwijderd als keuze).
 * Het type zelf (BlockType) en de render-/PDF-/vertaalondersteuning ervoor
 * blijven wel bestaan, als veiligheidsnet mocht een offerte er ooit toch een
 * bevatten.
 */
export const BLOCK_ORDER: BlockType[] = ["cover", "text", "gallery", "packages", "timeline"];

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
        pdfUrl: "",
        pdfUrl2: "",
        pdfLabel: "",
        pdfLabel2: "",
        maxSelections: 1,
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
    case "arrangement":
      // Nooit via de lege-blok-flow aangemaakt (zie newBlockFromArrangement)
      // -- alleen hier voor een technisch volledige switch.
      return {
        heading: "",
        arrangementId: "",
        name: "",
        description: "",
        colorCode: "#B87F2A",
        pricingMode: "vast",
        basePrice: 0,
        priceLabel: null,
        contentItems: [],
        pdfUrl: null,
      } satisfies ArrangementBlockContent;
  }
}

export function newBlock(type: BlockType, position: number): BlockDraft {
  return { id: uid(), type, position, content: defaultContentFor(type), isNew: true };
}

/** Samenvatting van een opgeslagen blok-template, zoals gebruikt door
 * `AddBlockMenu` en `newBlockFromTemplate`. */
export type BlockTemplateSummary = {
  id: string;
  type: BlockType;
  name: string;
  content: Record<string, unknown>;
};

/**
 * Regenereert alle client-gegenereerde id's in blok-content die als losse
 * rijen/opties gelden (galerijfoto's, tijdlijn-items, pakketten/opties) —
 * nodig omdat dezelfde blok-template op meerdere offertes toegepast kan
 * worden. Zonder dit zouden twee offertes die dezelfde blok-template
 * gebruiken dezelfde pakket-/optie-id's krijgen en elkaar in de weg zitten
 * zodra ze los bewerkt worden (zie ook de upsert-op-id-architectuur in
 * app/src/lib/blocks/persistence.ts).
 */
function regenerateContentIds(type: BlockType, content: Record<string, unknown>): Record<string, unknown> {
  const cloned = JSON.parse(JSON.stringify(content)) as Record<string, unknown>;

  if (type === "gallery") {
    const c = cloned as unknown as GalleryBlockContent;
    c.images = c.images.map((img) => ({ ...img, id: uid() }));
    return cloned;
  }

  if (type === "timeline") {
    const c = cloned as unknown as TimelineBlockContent;
    c.items = c.items.map((item) => ({ ...item, id: uid() }));
    return cloned;
  }

  if (type === "packages") {
    const c = cloned as unknown as PackagesBlockContent;
    const idMap = new Map<string, string>();
    c.packages = c.packages.map((pkg) => {
      const newId = uid();
      idMap.set(pkg.id, newId);
      return { ...pkg, id: newId };
    });
    c.addons = c.addons.map((addon) => ({
      ...addon,
      id: uid(),
      packageId: addon.packageId ? (idMap.get(addon.packageId) ?? null) : null,
    }));
    return cloned;
  }

  if (type === "arrangement") {
    const c = cloned as unknown as ArrangementBlockContent;
    c.contentItems = c.contentItems.map((item) => {
      if (item.type === "category") {
        return { ...item, id: uid(), items: item.items.map((sub) => ({ ...sub, id: uid() })) };
      }
      if (item.type === "extras") {
        return { ...item, id: uid(), items: item.items.map((sub) => ({ ...sub, id: uid() })) };
      }
      return { ...item, id: uid() };
    });
    return cloned;
  }

  return cloned;
}

export function newBlockFromTemplate(template: BlockTemplateSummary, position: number): BlockDraft {
  return {
    id: uid(),
    type: template.type,
    position,
    content: regenerateContentIds(template.type, template.content),
    isNew: true,
  };
}

/**
 * Nieuw offerteblok vanuit een catalogusarrangement — momentopname, geen
 * live koppeling (zie ArrangementBlockContent). `priceInfo` komt van
 * `calculateArrangementPrice()`, berekend door de aanroeper met de op dat
 * moment bekende datum/aantal personen van de offerte. Geneste id's
 * (secties/items/extra's) worden vers gegenereerd via regenerateContentIds,
 * zelfde reden als bij een blok-template: twee offertes met hetzelfde
 * bron-arrangement mogen nooit dezelfde geneste id's delen.
 */
export function newBlockFromArrangement(
  arrangement: {
    id: string;
    name: string;
    description: string;
    colorCode: string;
    pricingMode: ArrangementPricingMode;
    contentItems: ArrangementContentItem[];
    pdfUrl: string | null;
  },
  priceInfo: { price: number; appliedLabel: string | null },
  position: number,
): BlockDraft {
  const content: ArrangementBlockContent = {
    heading: arrangement.name,
    arrangementId: arrangement.id,
    name: arrangement.name,
    description: arrangement.description,
    colorCode: arrangement.colorCode,
    pricingMode: arrangement.pricingMode,
    basePrice: priceInfo.price,
    priceLabel: priceInfo.appliedLabel,
    contentItems: arrangement.contentItems,
    pdfUrl: arrangement.pdfUrl,
  };
  return {
    id: uid(),
    type: "arrangement",
    position,
    content: regenerateContentIds("arrangement", content as unknown as Record<string, unknown>),
    isNew: true,
  };
}

/** Kopieert een bestaand blok (offerte dupliceren) met een vers blok-id en
 * verse geneste id's (pakketten/opties/etc.) — zelfde reden als
 * newBlockFromTemplate: twee offertes mogen nooit dezelfde pakket-/optie-id
 * delen in de upsert-op-id-architectuur (zie persistence.ts). */
export function duplicateBlockDraft(block: BlockDraft): BlockDraft {
  return {
    id: uid(),
    type: block.type,
    position: block.position,
    content: regenerateContentIds(block.type, block.content),
    isNew: true,
  };
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
