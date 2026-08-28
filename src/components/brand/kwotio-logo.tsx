/** Volledig horizontaal Kwotio-logo (icoon + naam samen) — alleen voor het
 * inlogscherm. "onDark" = lichte tekstkleur (voor een donkere achtergrond),
 * anders donkere tekstkleur (voor een lichte achtergrond). `height` bepaalt
 * de hoogte; de breedte volgt de eigen beeldverhouding (320:90). */
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
      <circle cx="38" cy="40" r="9" fill="#B87F2A" />
      <polygon points="30,47 46,47 26,66" fill="#B87F2A" />
      <circle cx="64" cy="40" r="9" fill="#B87F2A" />
      <polygon points="56,47 72,47 52,66" fill="#B87F2A" />
      <text
        x="92"
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
