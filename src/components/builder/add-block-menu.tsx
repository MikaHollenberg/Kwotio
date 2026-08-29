"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, ChevronLeft, FileStack } from "lucide-react";
import type { BlockType } from "@/lib/types/database";
import { BLOCK_LABELS, BLOCK_ICONS, BLOCK_ORDER, type BlockTemplateSummary } from "@/lib/blocks/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AddBlockMenu({
  onAdd,
  blockTemplates = [],
}: {
  onAdd: (type: BlockType, template?: BlockTemplateSummary) => void;
  /** Organisatie-brede blok-templates — als er voor het gekozen bloktype
   * templates bestaan, krijgt de gebruiker eerst de keuze tussen leeg
   * beginnen en een van die templates. */
  blockTemplates?: BlockTemplateSummary[];
}) {
  const [open, setOpen] = useState(false);
  const [drillType, setDrillType] = useState<BlockType | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setDrillType(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function close() {
    setOpen(false);
    setDrillType(null);
  }

  function handlePickType(type: BlockType) {
    const templatesForType = blockTemplates.filter((t) => t.type === type);
    if (templatesForType.length === 0) {
      onAdd(type);
      close();
      return;
    }
    setDrillType(type);
  }

  const templatesForDrillType = drillType ? blockTemplates.filter((t) => t.type === drillType) : [];

  return (
    <div ref={ref} className="relative">
      <Button type="button" variant="secondary" onClick={() => setOpen((v) => !v)}>
        <Plus className="size-4" /> Blok toevoegen
      </Button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-2 w-72 rounded-brand-sm border border-ink-200 bg-white p-1.5 shadow-lg">
          {drillType ? (
            <>
              <button
                type="button"
                onClick={() => setDrillType(null)}
                className="flex w-full items-center gap-2 rounded-brand-sm px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-ink-400 hover:bg-sand-200"
              >
                <ChevronLeft className="size-3.5" /> Terug
              </button>
              <button
                type="button"
                onClick={() => {
                  onAdd(drillType);
                  close();
                }}
                className="flex w-full items-center gap-2.5 rounded-brand-sm px-3 py-2 text-left text-sm text-ink-500 transition-colors duration-200 ease-brand hover:bg-sand-200"
              >
                <span className="text-base">{BLOCK_ICONS[drillType]}</span> Leeg beginnen
              </button>
              <div className="my-1 border-t border-ink-100" />
              {templatesForDrillType.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => {
                    onAdd(drillType, template);
                    close();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-brand-sm px-3 py-2 text-left text-sm text-ink-500 transition-colors duration-200 ease-brand hover:bg-sand-200"
                >
                  <FileStack className="size-4 shrink-0 text-teal-600" />
                  <span className="truncate">{template.name}</span>
                </button>
              ))}
            </>
          ) : (
            BLOCK_ORDER.map((type) => {
              const count = blockTemplates.filter((t) => t.type === type).length;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => handlePickType(type)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2.5 rounded-brand-sm px-3 py-2 text-left text-sm text-ink-500 transition-colors duration-200 ease-brand hover:bg-sand-200",
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-base">{BLOCK_ICONS[type]}</span>
                    {BLOCK_LABELS[type]}
                  </span>
                  {count > 0 && <span className="text-xs font-medium text-ink-300">{count}</span>}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
