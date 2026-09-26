"use client";

import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorIllustration } from "@/components/brand/error-illustration";

/** Renderde binnen dashboard/layout.tsx (sidebar/topbar blijven staan) --
 * vangt een onverwachte runtime-fout op een dashboardpagina op, zelfde
 * in-shell-kaartpatroon als not-found.tsx hiernaast. */
export default function DashboardError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <ErrorIllustration variant="500" size={64} />
      <div>
        <p className="font-display text-lg font-semibold text-ink-500">Er ging iets mis</p>
        <p className="mt-1 text-sm text-ink-400">
          De cocktail is gevallen. We ruimen het op — probeer het zo nog eens.
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={retry} className="mt-1">
        Probeer opnieuw
      </Button>
    </Card>
  );
}
