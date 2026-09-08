"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { updateOrganizationPublicSlug } from "../actions";

export function OrganizationPublicPageCard({
  organizationId,
  initialSlug,
}: {
  organizationId: string;
  initialSlug: string;
}) {
  const [slug, setSlug] = useState(initialSlug);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Publieke offertepagina</CardTitle>
          <CardDescription>
            De link waarop klanten zonder in te loggen de publiek zichtbare templates van deze
            organisatie kunnen bekijken en een offerte kunnen aanvragen.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            setSaved(false);
            startTransition(async () => {
              try {
                await updateOrganizationPublicSlug(organizationId, slug);
                setSaved(true);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Opslaan mislukt.");
              }
            });
          }}
        >
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-400">
            Link
            <div className="flex items-center gap-1 text-sm">
              <span className="text-ink-300">/offertes/</span>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="h-10 w-56 rounded-brand-sm border border-ink-200 bg-white px-3 text-sm text-ink-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
          </label>
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Bezig met opslaan…" : "Opslaan"}
          </Button>
          {saved && !pending && <span className="text-sm text-emerald-600">Opgeslagen.</span>}
        </form>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </CardContent>
    </Card>
  );
}
