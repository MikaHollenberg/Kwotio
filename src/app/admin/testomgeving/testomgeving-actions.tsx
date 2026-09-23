"use client";

import { useState, useTransition } from "react";
import { RotateCcw, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { enterTestomgeving, resetTestomgeving } from "./actions";

export function TestomgevingActions() {
  const [pending, startTransition] = useTransition();
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="gold" disabled={pending} onClick={() => startTransition(() => enterTestomgeving())}>
        <LogIn className="size-4" /> Open testomgeving
      </Button>
      <Button
        variant="ghost"
        disabled={pending}
        className="text-red-600 hover:bg-red-50"
        onClick={() => setConfirmReset(true)}
      >
        <RotateCcw className="size-4" /> Testomgeving resetten
      </Button>

      <ConfirmDialog
        open={confirmReset}
        title="Testomgeving resetten"
        description="Alle offertes, klanten, templates, facturen en aanvragen in de testomgeving worden permanent verwijderd. Organisatie-instellingen (logo, huisstijl, factuurinstellingen) blijven staan. Dit kan niet ongedaan gemaakt worden."
        confirmLabel="Resetten"
        danger
        pending={pending}
        onConfirm={() =>
          startTransition(async () => {
            await resetTestomgeving();
            setConfirmReset(false);
          })
        }
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}
