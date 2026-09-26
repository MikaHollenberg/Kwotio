/** Cocktailbar-thema-lijntekening voor foutpagina's (404/500) i.p.v. een
 * kaal icoon -- een omgevallen glas voor "niet gevonden", een gebroken
 * shaker voor "er ging iets mis". Zelfde dunne-lijnstijl als de rest van de
 * app (Lucide), puur decoratief dus `aria-hidden`. */
export function ErrorIllustration({
  variant,
  size = 96,
  className,
}: {
  variant: "404" | "500";
  size?: number;
  className?: string;
}) {
  if (variant === "404") {
    return (
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className={className}
        aria-hidden="true"
      >
        <path
          d="M20 22 H80 L58 55 V78 H70 M50 78 H35"
          fill="none"
          stroke="var(--color-gold-500, #b87f2a)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <g stroke="var(--color-ink-200, #aab6bc)" strokeWidth="2" strokeLinecap="round">
          <circle cx="30" cy="60" r="1.6" fill="var(--color-ink-200, #aab6bc)" />
          <circle cx="24" cy="70" r="1.6" fill="var(--color-ink-200, #aab6bc)" />
          <circle cx="16" cy="62" r="1.6" fill="var(--color-ink-200, #aab6bc)" />
        </g>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden="true">
      <path
        d="M35 30 L65 30 L60 55 L70 55 L45 85 L50 60 L40 60 Z"
        fill="none"
        stroke="var(--color-red-600, #dc2626)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M28 22 Q32 16 38 20 M72 22 Q68 16 62 20"
        stroke="var(--color-ink-200, #aab6bc)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
