import { cn } from "@/lib/utils";

/** Subtiele golflijn als sectiedivider op klant-facing offertepagina's (sectie 2.3). */
export function WaveDivider({
  className,
  color = "currentColor",
  flip = false,
}: {
  className?: string;
  color?: string;
  flip?: boolean;
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
      />
    </svg>
  );
}
