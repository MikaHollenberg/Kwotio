import Link from "next/link";
import { KwotioMark } from "@/components/brand/kwotio-mark";

export default function PublicOrgPageNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-sand-100 px-6 text-center">
      <KwotioMark size={40} />
      <div>
        <h1 className="font-display text-xl font-semibold text-ink-500">Pagina niet gevonden</h1>
        <p className="mt-2 text-sm text-ink-400">
          Deze link bestaat niet (meer). Controleer of je de juiste link hebt gekregen.
        </p>
      </div>
      <Link href="/" className="text-sm font-medium text-teal-600 hover:text-teal-700">
        Naar de homepage
      </Link>
    </div>
  );
}
