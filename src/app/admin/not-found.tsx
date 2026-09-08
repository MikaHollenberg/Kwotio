import { FileQuestion } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/** Renderde binnen admin/layout.tsx (AdminSidebar blijft staan) — vangt
 * notFound() op van bv. een niet-bestaand organisatie-id onder /admin/*. */
export default function AdminNotFound() {
  return (
    <Card className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <FileQuestion className="size-8 text-ink-300" />
      <div>
        <p className="font-display text-lg font-semibold text-ink-500">Niet gevonden</p>
        <p className="mt-1 text-sm text-ink-400">Deze pagina bestaat niet (meer).</p>
      </div>
      <ButtonLink href="/admin/organisaties" size="sm" variant="outline" className="mt-1">
        Naar organisaties
      </ButtonLink>
    </Card>
  );
}
