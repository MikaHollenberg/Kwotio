"use client";

import { useEffect } from "react";
import Link from "next/link";
import { KwotioMark } from "@/components/brand/kwotio-mark";
import { ErrorIllustration } from "@/components/brand/error-illustration";
import { Button } from "@/components/ui/button";

/** Vangt een onverwachte runtime-fout op elke route onder de root-layout
 * (behalve de root-layout zelf, zie global-error.tsx). Error boundaries
 * moeten een Client Component zijn. */
export default function GlobalRouteError({
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
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-sand-100 px-6 text-center">
      <KwotioMark size={28} />
      <ErrorIllustration variant="500" />
      <div>
        <h1 className="font-display text-xl font-semibold text-ink-500">Er ging iets mis</h1>
        <p className="mt-2 text-sm text-ink-400">
          De cocktail is gevallen. We ruimen het op — probeer het zo nog eens.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={retry}>
          Probeer opnieuw
        </Button>
        <Link href="/" className="text-sm font-medium text-teal-600 hover:text-teal-700">
          Naar de homepage
        </Link>
      </div>
    </div>
  );
}
