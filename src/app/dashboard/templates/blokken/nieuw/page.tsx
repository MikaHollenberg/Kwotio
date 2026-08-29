"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, TextInput } from "@/components/builder/field";
import { Button } from "@/components/ui/button";
import { BLOCK_LABELS, BLOCK_ICONS, BLOCK_ORDER } from "@/lib/blocks/types";
import type { BlockType } from "@/lib/types/database";
import { createBlockTemplate } from "@/app/dashboard/templates/blokken/actions";
import { cn } from "@/lib/utils";

export default function NieuweBlokTemplatePage() {
  const [name, setName] = useState("");
  const [type, setType] = useState<BlockType>("text");
  const [pending, startTransition] = useTransition();

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Nieuwe blok-template</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              startTransition(() => createBlockTemplate({ name, type }));
            }}
          >
            <Field label="Naam">
              <TextInput
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="bijv. Standaard intro, BBQ-pakketten"
                required
                autoFocus
              />
            </Field>

            <div>
              <p className="mb-2 text-xs font-semibold text-ink-400">Bloktype</p>
              <div className="grid grid-cols-2 gap-2">
                {BLOCK_ORDER.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setType(option)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-brand-sm border-2 px-3.5 py-3 text-left text-sm transition-colors duration-200 ease-brand",
                      type === option ? "border-teal-500 bg-teal-50 text-ink-500" : "border-ink-100 text-ink-400 hover:border-ink-200",
                    )}
                  >
                    <span className="text-base">{BLOCK_ICONS[option]}</span>
                    {BLOCK_LABELS[option]}
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" disabled={pending || !name} className="mt-2">
              {pending ? "Bezig…" : "Blok-template aanmaken"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
