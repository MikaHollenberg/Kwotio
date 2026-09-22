import { FlaskConical } from "lucide-react";
import { verlaatTestomgeving } from "@/app/admin/testomgeving/actions";

/**
 * Duidelijke, niet te missen markering bovenaan elke dashboardpagina zolang
 * je via het hoofdaccount in de testomgeving zit (zie dashboard/layout.tsx) —
 * voorkomt dat testdata ooit met een echte organisatie verward wordt. Gewone
 * Server Component: een <form> gebonden aan een server action heeft geen
 * client-boundary nodig.
 */
export function TestEnvironmentBanner() {
  return (
    <div className="flex items-center justify-center gap-3 bg-blue-600 px-4 py-2 text-sm font-medium text-white">
      <FlaskConical className="size-4 flex-none" strokeWidth={2} />
      <span>Je zit in de testomgeving — wijzigingen raken geen echte organisatie.</span>
      <form action={verlaatTestomgeving}>
        <button type="submit" className="font-semibold underline underline-offset-2 hover:no-underline">
          Terug naar hoofdaccount
        </button>
      </form>
    </div>
  );
}
