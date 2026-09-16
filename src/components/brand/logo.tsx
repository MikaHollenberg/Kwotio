import { cn } from "@/lib/utils";
import { KwotioMark } from "./kwotio-mark";

export function Logo({
  className,
  height = 40,
  logoUrl,
  alt = "Logo",
}: {
  className?: string;
  height?: number;
  /** Resolved logo-URL van een organisatie (bijv. via resolvePreferredLogo()
   * of organizations.logo_horizontal_url) — valt terug op het neutrale
   * Kwotio-beeldmerk als dit niet gezet is. Dit component toont NOOIT een
   * hardcoded klant-huisstijl als standaardwaarde -- een organisatie zonder
   * eigen logo hoort altijd het platform-merk te zien, nooit toevallig het
   * logo van een andere (eerste) klant. Onbekende beeldverhouding bij een
   * eigen logoUrl, dus geen next/image (die een vaste intrinsieke breedte/
   * hoogte nodig heeft). */
  logoUrl?: string | null;
  alt?: string;
}) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={alt}
        className={cn("h-auto w-auto object-contain", className)}
        style={{ height, maxWidth: height * 4 }}
      />
    );
  }

  return <KwotioMark size={height} className={className} />;
}
