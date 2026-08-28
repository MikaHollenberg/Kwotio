import Image from "next/image";
import { cn } from "@/lib/utils";

const VARIANTS = {
  horizontaal: { src: "/brand/logo-horizontaal.png", ratio: 1800 / 719 },
  vierkant: { src: "/brand/logo-vierkant.png", ratio: 1683 / 1800 },
  rond: { src: "/brand/logo-rond.png", ratio: 1727 / 1800 },
} as const;

export function Logo({
  variant = "horizontaal",
  className,
  height = 40,
  priority,
  logoUrl,
  alt = "Caribbean Bar Uitgeest",
}: {
  variant?: keyof typeof VARIANTS;
  className?: string;
  height?: number;
  priority?: boolean;
  /** Resolved logo-URL van een organisatie (bijv. via resolvePreferredLogo()
   * of organizations.logo_horizontal_url) — valt terug op het standaard
   * Caribbean Bar-logo als dit niet gezet is. Onbekende beeldverhouding, dus
   * geen next/image (die een vaste intrinsieke breedte/hoogte nodig heeft). */
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

  const { src, ratio } = VARIANTS[variant];
  return (
    <Image
      src={src}
      alt={alt}
      width={Math.round(height * ratio)}
      height={height}
      priority={priority}
      className={cn("h-auto w-auto object-contain", className)}
      style={{ height }}
    />
  );
}
