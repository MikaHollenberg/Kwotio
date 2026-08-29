"use client";

import { useState } from "react";
import type { BlockDraft, PackagesBlockContent } from "@/lib/blocks/types";
import { defaultSelections, calculateSubtotal, type Selections, type PackagesBlockInput } from "@/lib/blocks/pricing";

export function useQuoteSelections(blocks: BlockDraft[], initial?: Selections) {
  const packagesBlocks = blocks.filter((b) => b.type === "packages");
  const blocksInput: PackagesBlockInput[] = packagesBlocks.map((b) => {
    const content = b.content as PackagesBlockContent;
    return { blockId: b.id, packages: content.packages, addons: content.addons };
  });

  const key = blocksInput.map((b) => `${b.blockId}:${b.packages.length}:${b.addons.length}`).join("|");
  const [resolvedKey, setResolvedKey] = useState(key);
  const [selections, setSelections] = useState<Selections>(() => initial ?? defaultSelections(blocksInput));

  if (key !== resolvedKey) {
    setResolvedKey(key);
    setSelections(defaultSelections(blocksInput));
  }

  const subtotal = calculateSubtotal(blocksInput, selections);

  return { packagesBlocks, blocksInput, selections, setSelections, subtotal };
}
