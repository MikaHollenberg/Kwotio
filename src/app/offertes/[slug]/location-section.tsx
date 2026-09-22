import Image from "next/image";
import { MapPin } from "lucide-react";

/**
 * Optionele "Locatie"-sectie op de publieke pakkettenpagina: een foto van
 * de locatie zelf, per organisatie in te stellen (Instellingen →
 * Organisatie → "Locatiefoto"). Geen foto ingesteld = deze sectie bestaat
 * simpelweg niet (zie PublicOrgPageView) -- geen aparte aan/uit-toggle
 * nodig, hetzelfde patroon als termsUrl elders op deze pagina.
 */
export function LocationSection({
  photoUrl,
  caption,
  address,
  organizationName,
  accentColor,
}: {
  photoUrl: string;
  caption: string | null;
  address: string | null;
  organizationName: string;
  accentColor: string;
}) {
  return (
    <div className="flex flex-col gap-3.5">
      <h2 className="font-display text-lg font-semibold text-ink-500">Locatie</h2>
      <div className="relative h-[280px] w-full overflow-hidden rounded-brand-lg sm:h-[340px]">
        <Image
          src={photoUrl}
          alt={`Locatie van ${organizationName}`}
          fill
          sizes="(min-width: 640px) 768px, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-0.5 bg-gradient-to-t from-ink-500/75 to-transparent px-6 py-5">
          <span className="font-display text-lg font-semibold text-white">{organizationName}</span>
          {caption && <span className="text-sm text-white/85">{caption}</span>}
        </div>
      </div>
      {address && (
        <div className="flex items-center gap-2 text-sm text-ink-400">
          <MapPin className="size-4 shrink-0" style={{ color: accentColor }} />
          <span>{address}</span>
        </div>
      )}
    </div>
  );
}
