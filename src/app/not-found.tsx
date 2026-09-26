import Link from "next/link";
import { KwotioMark } from "@/components/brand/kwotio-mark";
import { ErrorIllustration } from "@/components/brand/error-illustration";

/**
 * Algemene 404 — vangnet voor elke route zonder eigen not-found.tsx (bv.
 * een verkeerd getypt adres, of een verlopen/onjuiste offerte-link onder
 * /offerte/[token]). Routes met eigen context (dashboard, hoofdaccount, de
 * publieke organisatiepagina) hebben hun eigen, meer specifieke variant —
 * Next.js kiest automatisch de dichtstbijzijnde.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-sand-100 px-6 text-center">
      <KwotioMark size={28} />
      <ErrorIllustration variant="404" />
      <div>
        <h1 className="font-display text-xl font-semibold text-ink-500">Deze pagina is zoek</h1>
        <p className="mt-2 text-sm text-ink-400">
          We hebben overal gezocht, zelfs achter de bar. Niks gevonden op dit adres.
        </p>
      </div>
      <Link href="/" className="text-sm font-medium text-teal-600 hover:text-teal-700">
        Naar de homepage
      </Link>
    </div>
  );
}
