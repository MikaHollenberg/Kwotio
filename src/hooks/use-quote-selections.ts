"use client";

import { useState } from "react";
import type { BlockDraft, PackagesBlockContent } from "@/lib/blocks/types";
import { defaultSelections, calculateSubtotal, type Selections } from "@/lib/blocks/pricing";

export function useQuoteSelections(blocks: BlockDraft[], initial?: Selections) {
  const packagesBlock = blocks.find((b) => b.type === "packages");
  const packagesContent = packagesBlock?.content as PackagesBlockContent | undefined;

  const key = `${packagesBlock?.id ?? ""}:${packagesContent?.packages.length ?? 0}:${packagesContent?.addons.length ?? 0}`;
  const [resolvedKey, setResolvedKey] = useState(key);
  const [selections, setSelections] = useState<Selections>(
    () => initial ?? defaultSelections(packagesContent?.packages ?? [], packagesContent?.addons ?? []),
  );

  if (key !== resolvedKey) {
    setResolvedKey(key);
    setSelections(defaultSelections(packagesContent?.packages ?? [], packagesContent?.addons ?? []));
  }

  const subtotal = packagesContent
    ? calculateSubtotal(packagesContent.packages, packagesContent.addons, selections)
    : 0;

  return { packagesBlock, packagesContent, selections, setSelections, subtotal };
}
