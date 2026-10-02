import { cn } from "@/lib/utils";

/** Subtiele golflijn als sectiedivider op klant-facing offertepagina's (sectie 2.3).
 * Met `draw` tekent de lijn zichzelf in zodra hij verschijnt (alleen gebruikt
 * op de publieke aanvraagpagina; `delayMs` laat hem na de rest van de
 * gestaffelde intro volgen). */
export function WaveDivider({
  className,
  color = "currentColor",
  flip = false,
  draw = false,
  delayMs = 0,
}: {
  className?: string;
  color?: string;
  flip?: boolean;
  draw?: boolean;
  delayMs?: number;
}) {
  return (
    <svg
      viewBox="0 0 1200 40"
      preserveAspectRatio="none"
      className={cn("h-8 w-full", flip && "rotate-180", className)}
      aria-hidden="true"
    >
      <path
        d="M0 20 C 150 0, 300 40, 600 20 C 900 0, 1050 40, 1200 20"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        pathLength={draw ? 1 : undefined}
        className={draw ? "kw-wave-draw" : undefined}
        style={draw ? ({ "--kw-delay": `${delayMs}ms` } as React.CSSProperties) : undefined}
      />
    </svg>
  );
}
