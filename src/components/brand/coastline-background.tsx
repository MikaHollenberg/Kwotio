/**
 * Optionele, per-organisatie instelbare achtergronddecoratie voor de
 * publieke pakkettenpagina (app/offertes/[slug]) -- een dunne, verfijnde
 * kustlijn-illustratie (horizon, twee zeilbootjes, een zonnetje, twee zachte
 * golflijnen) die als een soort briefhoofd-strip helemaal onderaan de
 * pagina staat. Bewust EEN enkele, subtiele illustratie i.p.v. een
 * herhaald patroon -- zie de mockup-verkenning (10 achtergrond-richtingen,
 * optie 8 "Kustlijn onderaan") die hieraan voorafging.
 *
 * Puur decoratief (aria-hidden), en bewust GEEN eigen achtergrondkleur --
 * de illustratie tekent zich af tegen de bestaande sand-100-pagina-
 * achtergrond. `preserveAspectRatio="none"` is hier bewust: een horizonlijn
 * mag prima horizontaal uitrekken over de volle paginabreedte.
 */
export function CoastlineBackground() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1280 170"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[110px] w-full sm:h-[150px]"
    >
      <circle cx="1120" cy="46" r="20" fill="none" stroke="#C98A4E" strokeWidth="1.4" opacity="0.5" />
      <line x1="0" y1="90" x2="1280" y2="90" stroke="#8FA6AC" strokeWidth="1.2" opacity="0.35" />
      <g stroke="#5C7A82" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.4">
        <path d="M220 90V56" />
        <path d="M220 58c14 4 22 14 24 32-10 1-18-2-24-8" />
        <path d="M198 90h50l-6 12h-38l-6-12Z" />
      </g>
      <g stroke="#5C7A82" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.3">
        <path d="M760 90V66" />
        <path d="M760 68c10 3 16 10 17 23-7 1-13-1-17-6" />
        <path d="M744 90h34l-4 9h-26l-4-9Z" />
      </g>
      <path
        d="M0 118 C160 104 320 132 480 118 C640 104 800 132 960 118 C1120 104 1280 128 1280 118"
        stroke="#8FA6AC"
        strokeWidth="1.3"
        fill="none"
        opacity="0.3"
      />
      <path
        d="M0 140 C170 128 330 152 500 140 C670 128 830 152 1000 140 C1170 128 1280 148 1280 140"
        stroke="#B7CFC6"
        strokeWidth="1.2"
        fill="none"
        opacity="0.25"
      />
    </svg>
  );
}
