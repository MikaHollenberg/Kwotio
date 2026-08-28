"use client";

import { useState, useRef, useEffect } from "react";
import { Plus } from "lucide-react";
import type { BlockType } from "@/lib/types/database";
import { BLOCK_LABELS, BLOCK_ORDER } from "@/lib/blocks/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const BLOCK_ICONS: Record<BlockType, string> = {
  cover: "🖼️",
  text: "📝",
  gallery: "🌴",
  packages: "💶",
  timeline: "🕒",
  terms: "📄",
  signature: "✍️",
};

export function AddBlockMenu({ onAdd }: { onAdd: (type: BlockType) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <Button type="button" variant="secondary" onClick={() => setOpen((v) => !v)}>
        <Plus className="size-4" /> Blok toevoegen
      </Button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-2 w-64 rounded-brand-sm border border-ink-200 bg-white p-1.5 shadow-lg">
          {BLOCK_ORDER.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                onAdd(type);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-brand-sm px-3 py-2 text-left text-sm text-ink-500 transition-colors duration-200 ease-brand hover:bg-sand-200",
              )}
            >
              <span className="text-base">{BLOCK_ICONS[type]}</span>
              {BLOCK_LABELS[type]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
