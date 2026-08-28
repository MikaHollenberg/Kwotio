import type { Metadata } from "next";
import { KwotioLogo } from "@/components/brand/kwotio-logo";
import { KwotioIconScatter } from "@/components/brand/kwotio-icon-scatter";
import { APP_NAME } from "@/lib/app-config";

const KWOTIO_FAVICON =
  "data:image/svg+xml," +
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 80'>" +
  "<circle cx='38' cy='40' r='9' fill='%23B87F2A'/>" +
  "<polygon points='30,47 46,47 26,66' fill='%23B87F2A'/>" +
  "<circle cx='64' cy='40' r='9' fill='%23B87F2A'/>" +
  "<polygon points='56,47 72,47 52,66' fill='%23B87F2A'/>" +
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
  icons: { icon: KWOTIO_FAVICON },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col overflow-hidden bg-ink-500 px-12 py-12 text-white lg:flex">
        <KwotioIconScatter />

        <div className="relative flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <KwotioLogo height={64} onDark />
          <p className="text-sm text-white/60">Offerte- en klantportaal</p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center bg-sand-100 px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center lg:hidden">
            <KwotioLogo height={40} />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
