import { FileQuestion } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * Renderde binnen dashboard/layout.tsx (sidebar/topbar blijven staan) —
 * vangt notFound() op van elke detailpagina onder /dashboard/* (offerte,
 * klant, template, blok-template, aanvraag) met een niet-bestaand id.
 */
export default function DashboardNotFound() {
  return (
    <Card className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <FileQuestion className="size-8 text-ink-300" />
      <div>
        <p className="font-display text-lg font-semibold text-ink-500">Niet gevonden</p>
        <p className="mt-1 text-sm text-ink-400">
          Deze pagina bestaat niet (meer), of je hebt er geen toegang toe.
        </p>
      </div>
      <ButtonLink href="/dashboard" size="sm" variant="outline" className="mt-1">
        Naar het overzicht
      </ButtonLink>
    </Card>
  );
}
