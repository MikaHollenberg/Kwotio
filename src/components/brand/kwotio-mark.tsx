/** Beeldmerk van het platform zelf (Kwotio) — losstaand van de per-organisatie
 * <Logo>-component, die de huisstijl van de ingelogde organisatie toont.
 * `size` is de hoogte; de breedte volgt de eigen beeldverhouding (100:80). */
export function KwotioMark({ size = 64, className }: { size?: number; className?: string }) {
  const height = size;
  const width = size * (100 / 80);
  return (
    <svg width={width} height={height} viewBox="0 0 100 80" role="img" aria-label="Kwotio" className={className}>
      <circle cx="38" cy="40" r="9" fill="#B87F2A" />
      <polygon points="30,47 46,47 26,66" fill="#B87F2A" />
      <circle cx="64" cy="40" r="9" fill="#B87F2A" />
      <polygon points="56,47 72,47 52,66" fill="#B87F2A" />
    </svg>
  );
}
