/** Beeldmerk van het platform zelf (Kwotio) — losstaand van de per-organisatie
 * <Logo>-component, die de huisstijl van de ingelogde organisatie toont.
 * Een checkbox met een vinkje erin, waarvan de schuine haal een extra
 * neerwaartse streep krijgt zodat het geheel ook als een "K" leest.
 * `size` is zowel de hoogte als de breedte (vierkante beeldverhouding). */
export function KwotioMark({ size = 64, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="Kwotio" className={className}>
      <rect x="6" y="6" width="88" height="88" rx="22" fill="none" stroke="#B87F2A" strokeWidth="7" />
      <polyline
        points="26,50 42,66 63,26"
        fill="none"
        stroke="#B87F2A"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="53.5" y1="44" x2="64.5" y2="66" stroke="#B87F2A" strokeWidth="10" strokeLinecap="round" />
    </svg>
  );
}
