/** Beeldmerk van het platform zelf (Offerio) — losstaand van de per-organisatie
 * <Logo>-component, die de huisstijl van de ingelogde organisatie toont. */
export function OfferioMark({ size = 64, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="Offerio logo" className={className}>
      <circle cx="50" cy="42" r="34" fill="none" stroke="#B87F2A" strokeWidth="4" />
      <circle cx="50" cy="42" r="25" fill="none" stroke="#B87F2A" strokeWidth="2.5" />
      <polyline
        points="37,42 47,52 65,30"
        fill="none"
        stroke="#B87F2A"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M32 68 L24 92 L40 82 Z" fill="#B87F2A" />
      <path d="M68 68 L76 92 L60 82 Z" fill="#B87F2A" />
    </svg>
  );
}
