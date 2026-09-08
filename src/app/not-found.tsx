import Link from "next/link";
import { KwotioMark } from "@/components/brand/kwotio-mark";

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
      <KwotioMark size={40} />
      <div>
        <h1 className="font-display text-xl font-semibold text-ink-500">Pagina niet gevonden</h1>
        <p className="mt-2 text-sm text-ink-400">
          Deze pagina bestaat niet (meer). Controleer of je het juiste adres hebt.
        </p>
      </div>
      <Link href="/" className="text-sm font-medium text-teal-600 hover:text-teal-700">
        Naar de homepage
      </Link>
    </div>
  );
}
