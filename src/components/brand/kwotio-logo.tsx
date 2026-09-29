/** Volledig horizontaal Kwotio-logo (K-vinkje-icoon + naam samen) — alleen
 * voor het inlogscherm. "onDark" = lichte tekstkleur (voor een donkere
 * achtergrond), anders donkere tekstkleur (voor een lichte achtergrond).
 * `height` bepaalt de hoogte; de breedte volgt de eigen beeldverhouding
 * (320:90). Zelfde paden als `kwotio-mark.tsx`, hier geschaald/verplaatst
 * via een `<g transform>` i.p.v. losse coördinaten. */
export function KwotioLogo({
  height = 56,
  onDark = false,
  className,
}: {
  height?: number;
  onDark?: boolean;
  className?: string;
}) {
  const width = height * (320 / 90);
  const textFill = onDark ? "#EDE7D6" : "#1B241F";
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 320 90"
      role="img"
      aria-label="Kwotio"
      className={className}
    >
      <g transform="translate(10,10) scale(0.7)">
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
      </g>
      <text
        x="100"
        y="56"
        fontFamily="'Bricolage Grotesque', 'Arial Black', sans-serif"
        fontWeight="700"
        fontSize="42"
        fill={textFill}
      >
        Kwotio
      </text>
    </svg>
  );
}
