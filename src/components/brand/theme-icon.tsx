import Image from "next/image";
import { cn } from "@/lib/utils";

const THEME_ICONS = {
  zon: "/brand/icoon-zon.png",
  zeilboot: "/brand/icoon-zeilboot.png",
  cocktail: "/brand/icoon-cocktail.png",
  bbq: "/brand/icoon-bbq.png",
} as const;

export type ThemeIconKey = keyof typeof THEME_ICONS;

const KEYWORD_MAP: { keywords: string[]; icon: ThemeIconKey }[] = [
  { keywords: ["sloep", "zeil", "boot", "chopper", "sup", "regatta", "water"], icon: "zeilboot" },
  { keywords: ["cocktail", "bar", "drank", "borrel"], icon: "cocktail" },
  { keywords: ["bbq", "barbecue", "grill", "catering"], icon: "bbq" },
];

/** Kiest automatisch het bijpassende thema-icoon o.b.v. naam/tags van een pakket of dienst. */
export function detectThemeIcon(text: string): ThemeIconKey | null {
  const lower = text.toLowerCase();
  for (const { keywords, icon } of KEYWORD_MAP) {
    if (keywords.some((k) => lower.includes(k))) return icon;
  }
  return null;
}

export function ThemeIcon({
  icon,
  size = 32,
  className,
}: {
  icon: ThemeIconKey;
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src={THEME_ICONS[icon]}
      alt=""
      width={size}
      height={size}
      className={cn("object-contain", className)}
      style={{ width: size, height: size }}
    />
  );
}
