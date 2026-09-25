"use client";

import { useState } from "react";
import type { BlockDraft } from "@/lib/blocks/types";
import {
  defaultSelections,
  calculateSubtotal,
  calculateSplitSubtotal,
  collectPricedBlocks,
  type Selections,
} from "@/lib/blocks/pricing";

export function useQuoteSelections(blocks: BlockDraft[], quotePricePerPerson: boolean, initial?: Selections) {
  // "packagesBlocks" blijft strikt het "packages"-bloktype (consumers casten
  // block.content rechtstreeks naar PackagesBlockContent) -- arrangement-
  // blokken tellen wél mee in de prijsberekening (via collectPricedBlocks)
  // maar hebben een eigen render-pad, geen PackagesBlockContent-vorm.
  const packagesBlocks = blocks.filter((b) => b.type === "packages");
  const pricedBlocks = blocks.filter((b) => b.type === "packages" || b.type === "arrangement");
  const arrangementBlocks = blocks.filter((b) => b.type === "arrangement");
  const blocksInput = collectPricedBlocks(pricedBlocks);

  const key = blocksInput.map((b) => `${b.blockId}:${b.packages.length}:${b.addons.length}`).join("|");
  const [resolvedKey, setResolvedKey] = useState(key);
  const [selections, setSelections] = useState<Selections>(() => initial ?? defaultSelections(blocksInput));

  if (key !== resolvedKey) {
    setResolvedKey(key);
    setSelections(defaultSelections(blocksInput));
  }

  const subtotal = calculateSubtotal(blocksInput, selections, arrangementBlocks);
  const splitSubtotal = calculateSplitSubtotal(blocksInput, selections, quotePricePerPerson, arrangementBlocks);

  return {
    packagesBlocks,
    hasPricedBlocks: pricedBlocks.length > 0,
    blocksInput,
    selections,
    setSelections,
    subtotal,
    splitSubtotal,
  };
}
