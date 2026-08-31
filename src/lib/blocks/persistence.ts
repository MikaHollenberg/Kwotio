import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import type {
  BlockDraft,
  PackagesBlockContent,
  PackageDraft,
  PackageAddon,
} from "@/lib/blocks/types";
import { mergeContentEn } from "@/lib/translation/resolve-content-en";

type Client = SupabaseClient<Database>;

// ---------------------------------------------------------------------------
// Templates — content (incl. pakketten/opties) staat volledig als JSON in
// template_blocks.content, dus laden/opslaan is een simpele 1:1-mapping.
// Blokken worden ge-upsert op hun (client-gegenereerde) uuid, zodat rij-ids
// stabiel blijven tussen saves.
// ---------------------------------------------------------------------------

export async function loadTemplateBlocks(supabase: Client, templateId: string): Promise<BlockDraft[]> {
  const { data, error } = await supabase
    .from("template_blocks")
    .select("id, type, position, content")
    .eq("template_id", templateId)
    .order("position", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    type: row.type,
    position: row.position,
    content: row.content,
  }));
}

export async function saveTemplateBlocks(supabase: Client, templateId: string, blocks: BlockDraft[]) {
  const { data: existing, error: existingError } = await supabase
    .from("template_blocks")
    .select("id")
    .eq("template_id", templateId);
  if (existingError) throw existingError;

  const incomingIds = new Set(blocks.map((b) => b.id));
  const toDelete = (existing ?? []).map((r) => r.id).filter((id) => !incomingIds.has(id));
  if (toDelete.length > 0) {
    const { error } = await supabase.from("template_blocks").delete().in("id", toDelete);
    if (error) throw error;
  }

  if (blocks.length === 0) return;

  const { error: upsertError } = await supabase.from("template_blocks").upsert(
    blocks.map((block, i) => ({
      id: block.id,
      template_id: templateId,
      type: block.type,
      position: i,
      content: block.content,
    })),
    { onConflict: "id" },
  );
  if (upsertError) throw upsertError;
}

// ---------------------------------------------------------------------------
// Offertes — pakketten/opties van een 'packages'-blok worden genormaliseerd
// opgeslagen in quote_packages/quote_addons (t.b.v. rapportage/statistieken),
// terwijl content alleen kop/intro bevat. Bij laden worden ze weer
// samengevoegd tot dezelfde BlockDraft-vorm die de editor/preview verwacht.
//
// Alles wordt ge-upsert op zijn (client-gegenereerde) uuid i.p.v.
// verwijderd+opnieuw-ingevoegd: de klant-facing offertepagina (Fase 3) slaat
// de gekozen quote_packages.id op, en die moet stabiel blijven ook als het
// bureau de offerte nadien nog bewerkt.
// ---------------------------------------------------------------------------

export async function loadQuoteBlocks(supabase: Client, quoteId: string): Promise<BlockDraft[]> {
  const { data: blockRows, error: blockError } = await supabase
    .from("quote_blocks")
    .select("id, type, position, content, content_en")
    .eq("quote_id", quoteId)
    .order("position", { ascending: true });
  if (blockError) throw blockError;

  const blocks: BlockDraft[] = [];

  for (const row of blockRows ?? []) {
    if (row.type !== "packages") {
      blocks.push({
        id: row.id,
        type: row.type,
        position: row.position,
        content: row.content,
        contentEn: mergeContentEn(row.type, row.content as Record<string, unknown>, row.content_en),
      });
      continue;
    }

    const [{ data: packageRows, error: pkgError }, { data: addonRows, error: addonError }] = await Promise.all([
      supabase
        .from("quote_packages")
        .select("id, name, description, photo_url, price, is_default_selected, sort_order")
        .eq("quote_block_id", row.id)
        .order("sort_order", { ascending: true }),
      supabase
        .from("quote_addons")
        .select("id, package_id, name, description, price, quantity_editable, default_quantity, sort_order")
        .eq("quote_block_id", row.id)
        .order("sort_order", { ascending: true }),
    ]);
    if (pkgError) throw pkgError;
    if (addonError) throw addonError;

    const packages: PackageDraft[] = (packageRows ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description ?? "",
      photoUrl: p.photo_url ?? "",
      price: Number(p.price),
      isDefaultSelected: p.is_default_selected,
    }));
    const addons: PackageAddon[] = (addonRows ?? []).map((a) => ({
      id: a.id,
      packageId: a.package_id,
      name: a.name,
      description: a.description ?? "",
      price: Number(a.price),
      quantityEditable: a.quantity_editable,
      defaultQuantity: a.default_quantity,
    }));

    const content = row.content as {
      heading?: string;
      intro?: string;
      pdfUrl?: string;
      pdfUrl2?: string;
      maxSelections?: 1 | 2;
    };
    const resolvedContent = {
      heading: content.heading ?? "",
      intro: content.intro ?? "",
      packages,
      addons,
      pdfUrl: content.pdfUrl ?? "",
      pdfUrl2: content.pdfUrl2 ?? "",
      maxSelections: content.maxSelections ?? 1,
    };
    blocks.push({
      id: row.id,
      type: "packages",
      position: row.position,
      content: resolvedContent,
      contentEn: mergeContentEn("packages", resolvedContent, row.content_en),
    });
  }

  return blocks;
}

async function replaceRows(
  supabase: Client,
  table: "quote_blocks" | "quote_packages" | "quote_addons",
  parentColumn: string,
  parentId: string,
  incomingIds: string[],
) {
  const { data: existing, error } = await supabase.from(table).select("id").eq(parentColumn, parentId);
  if (error) throw error;

  const incoming = new Set(incomingIds);
  const toDelete = (existing ?? []).map((r) => r.id).filter((id) => !incoming.has(id));
  if (toDelete.length > 0) {
    const { error: deleteError } = await supabase.from(table).delete().in("id", toDelete);
    if (deleteError) throw deleteError;
  }
}

export async function saveQuoteBlocks(supabase: Client, quoteId: string, blocks: BlockDraft[]) {
  await replaceRows(supabase, "quote_blocks", "quote_id", quoteId, blocks.map((b) => b.id));

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];

    if (block.type === "packages") {
      const content = block.content as PackagesBlockContent;

      const { error: blockError } = await supabase.from("quote_blocks").upsert(
        {
          id: block.id,
          quote_id: quoteId,
          type: "packages",
          position: i,
          content: {
            heading: content.heading,
            intro: content.intro,
            pdfUrl: content.pdfUrl,
            pdfUrl2: content.pdfUrl2,
            maxSelections: content.maxSelections,
          },
        },
        { onConflict: "id" },
      );
      if (blockError) throw blockError;

      await replaceRows(supabase, "quote_packages", "quote_block_id", block.id, content.packages.map((p) => p.id));

      if (content.packages.length > 0) {
        const { error: pkgError } = await supabase.from("quote_packages").upsert(
          content.packages.map((pkg, p) => ({
            id: pkg.id,
            quote_block_id: block.id,
            name: pkg.name,
            description: pkg.description || null,
            photo_url: pkg.photoUrl || null,
            price: pkg.price,
            is_default_selected: pkg.isDefaultSelected,
            sort_order: p,
          })),
          { onConflict: "id" },
        );
        if (pkgError) throw pkgError;
      }

      await replaceRows(supabase, "quote_addons", "quote_block_id", block.id, content.addons.map((a) => a.id));

      if (content.addons.length > 0) {
        const { error: addonError } = await supabase.from("quote_addons").upsert(
          content.addons.map((addon, a) => ({
            id: addon.id,
            quote_block_id: block.id,
            package_id: addon.packageId,
            name: addon.name,
            description: addon.description || null,
            price: addon.price,
            quantity_editable: addon.quantityEditable,
            default_quantity: addon.defaultQuantity,
            sort_order: a,
          })),
          { onConflict: "id" },
        );
        if (addonError) throw addonError;
      }
      continue;
    }

    const { error: blockError } = await supabase.from("quote_blocks").upsert(
      {
        id: block.id,
        quote_id: quoteId,
        type: block.type,
        position: i,
        content: block.content,
      },
      { onConflict: "id" },
    );
    if (blockError) throw blockError;
  }
}
