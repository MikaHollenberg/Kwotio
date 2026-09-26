"use client";

import { useTransition } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { restoreQuote } from "../actions";

export function RestoreQuoteButton({ quoteId, title }: { quoteId: string; title: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      title={`"${title}" herstellen`}
      onClick={() => startTransition(async () => { await restoreQuote(quoteId); })}
    >
      <RotateCcw className="size-4" /> Herstellen
    </Button>
  );
}
