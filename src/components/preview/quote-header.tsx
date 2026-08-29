import { Logo } from "@/components/brand/logo";

export type QuoteHeaderData = {
  organizationName: string;
  organizationLogoUrl: string | null;
  organizationAddress: { street?: string; postalCode?: string; city?: string; country?: string } | null;
  organizationKvk: string | null;
  organizationBtw: string | null;
  organizationEmail: string | null;
  organizationPhone: string | null;
  handledByName: string | null;
  clientName: string | null;
  clientEmail: string | null;
  clientPhone: string | null;
  clientCompany: string | null;
  referenceNumber: string | null;
};

/**
 * Kop-sectie bovenaan elke offerte: organisatiegegevens subtiel rechtsboven,
 * klantgegevens links. Staat altijd automatisch op de offerte (geen los toe
 * te voegen blok) — gedeeld tussen de bureau-preview (quote-preview.tsx) en
 * de publieke klantpagina (public-quote-view.tsx). De PDF-versie
 * (quote-document.tsx) rendert dezelfde gegevens los via @react-pdf/renderer
 * primitives, dit component is alleen voor de twee React/DOM-contexten.
 */
export function QuoteHeaderSection({ data }: { data: QuoteHeaderData }) {
  const hasClientInfo = data.clientName || data.clientEmail || data.clientPhone || data.clientCompany || data.referenceNumber;
  const address = data.organizationAddress;
  const addressLine = [address?.street, [address?.postalCode, address?.city].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");

  if (!hasClientInfo && !data.organizationName) return null;

  return (
    <div className="flex flex-col gap-6 px-6 py-6 sm:flex-row sm:items-start sm:justify-between">
      {hasClientInfo && (
        <div className="text-sm text-ink-500">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-300">Offerte voor</p>
          {data.clientName && <p className="mt-1 font-medium">{data.clientName}</p>}
          {data.clientCompany && <p className="text-ink-400">{data.clientCompany}</p>}
          {data.clientEmail && <p className="text-ink-400">{data.clientEmail}</p>}
          {data.clientPhone && <p className="text-ink-400">{data.clientPhone}</p>}
          {data.referenceNumber && <p className="mt-1 text-xs text-ink-400">Ref: {data.referenceNumber}</p>}
        </div>
      )}

      <div className="text-right text-xs text-ink-400 sm:shrink-0">
        {data.organizationLogoUrl && (
          <div className="mb-2 flex justify-end">
            <Logo logoUrl={data.organizationLogoUrl} height={28} />
          </div>
        )}
        <p className="font-semibold text-ink-500">{data.organizationName}</p>
        {addressLine && <p>{addressLine}</p>}
        {(data.organizationKvk || data.organizationBtw) && (
          <p>
            {data.organizationKvk && `KvK ${data.organizationKvk}`}
            {data.organizationKvk && data.organizationBtw && " · "}
            {data.organizationBtw && `Btw ${data.organizationBtw}`}
          </p>
        )}
        {data.organizationEmail && <p>{data.organizationEmail}</p>}
        {data.organizationPhone && <p>{data.organizationPhone}</p>}
        {data.handledByName && <p className="mt-1">Behandeld door: {data.handledByName}</p>}
      </div>
    </div>
  );
}
