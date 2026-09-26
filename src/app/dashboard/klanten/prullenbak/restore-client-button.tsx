"use client";

import { useTransition } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { restoreClient } from "../actions";

export function RestoreClientButton({ clientId, name }: { clientId: string; name: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      title={`"${name}" herstellen`}
      onClick={() => startTransition(async () => { await restoreClient(clientId); })}
    >
      <RotateCcw className="size-4" /> Herstellen
    </Button>
  );
}
