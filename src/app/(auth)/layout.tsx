import type { Metadata } from "next";
import { OfferioMark } from "@/components/brand/offerio-mark";
import { APP_NAME } from "@/lib/app-config";

const OFFERIO_FAVICON =
  "data:image/svg+xml," +
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>" +
  "<circle cx='50' cy='42' r='34' fill='none' stroke='%23B87F2A' stroke-width='4'/>" +
  "<circle cx='50' cy='42' r='25' fill='none' stroke='%23B87F2A' stroke-width='2.5'/>" +
  "<polyline points='37,42 47,52 65,30' fill='none' stroke='%23B87F2A' stroke-width='6' stroke-linecap='round' stroke-linejoin='round'/>" +
  "<path d='M32 68 L24 92 L40 82 Z' fill='%23B87F2A'/>" +
  "<path d='M68 68 L76 92 L60 82 Z' fill='%23B87F2A'/>" +
  "</svg>";

// Eigen titel-sjabloon + favicon voor deze route-groep — overschrijft alleen
// hier de site-brede metadata uit app/layout.tsx ("· Caribbean Bar Uitgeest",
// het zonnetje-icoon), zodat dashboard en klantportaal (buiten deze groep)
// ongewijzigd blijven. Bewust een expliciete icons-override i.p.v. een
// icon.svg-conventiebestand: Next.js merget metadata-objecten shallow, dus
// een expliciete override op dit segment wint gegarandeerd van de root-icons
// (een conventiebestand bleek dat niet betrouwbaar te doen naast een al
// expliciet ingestelde root-icons).
export const metadata: Metadata = {
  title: { template: `%s · ${APP_NAME}`, default: APP_NAME },
  icons: { icon: OFFERIO_FAVICON },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col overflow-hidden bg-ink-500 px-12 py-12 text-white lg:flex">
        <div className="relative flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <OfferioMark size={96} />
          <p className="font-display text-4xl font-semibold leading-tight">{APP_NAME}</p>
          <p className="text-sm text-white/60">Offerte- en klantportaal</p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center bg-sand-100 px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-2 lg:hidden">
            <OfferioMark size={48} />
            <p className="font-display text-xl font-semibold text-ink-500">{APP_NAME}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
