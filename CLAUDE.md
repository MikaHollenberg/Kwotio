@AGENTS.md
@../HANDOVER.md

# Kwotio-platform — kwaliteitsstandaard en designsysteem

Geldt voor al het werk aan het Kwotio-platform zelf (hoofdaccount/`/admin`, de
toekomstige marketingsite) — niet voor de klant-facing offertepagina's, die
volgen de huisstijl van de eigen organisatie (`resolveAccentColor()`), niet
dit systeem.

**Kwaliteitslat**: gebouwd op het niveau van een gefinancierd, premium
SaaS-product (Linear/Stripe/Notion/Framer-niveau polish), niet de generieke
"AI-gegenereerde" look. Concreet:
- Geen onnodige paarse/blauwe gradients, geen willekeurige emoji als
  iconen (gebruik Lucide, zoals de rest van de app), geen stockfoto's, geen
  vage Lorem-ipsum-achtige marketingtaal.
- Typografie, kleur, spacing en motion volgen altijd het designsysteem
  hieronder — nooit ad hoc iets nieuws introduceren. Nieuwe kleur nodig?
  Voeg 'm toe aan `globals.css`'s `@theme`-blok, gebruik 'm niet als losse
  hex-waarde in een component.
- Teksten zijn scherp, specifiek en verkopend, nooit vage claims.
- Animaties zijn subtiel en doelgericht (150-300ms, `ease-brand`), nooit
  overdreven.
- Test altijd op mobiel formaat én met toetsenbordnavigatie (zichtbare
  focus-states) voordat iets als klaar gemeld wordt.

**Designsysteem** (volledige stijlgids: `/admin/stijlgids`, alleen
super-admin):
- Typografie: Bricolage Grotesque (koppen, `font-display`) + Manrope (body,
  `font-sans`) — al overal geïntegreerd, incl. de factuur-PDF's. Schaal
  ×1.25: 12/16/20/25/31/39/49px.
- Kleur: `gold-50..900` (`--color-gold-*` in `globals.css`) is het
  Kwotio-platformmerk — accent, nooit een groot vlak, nooit hergebruikt als
  "orange" (dat blijft Caribbean Bar's terracotta). Cream/inkt: de
  bestaande `sand-*`/`ink-*`-schalen. Semantisch: `green` (succes), `amber`
  (waarschuwing), `red` (fout), `sky` (info) — bewust Tailwinds eigen
  ongewijzigde schalen, niet "yellow"/"blue" (die zijn al hergedefinieerd
  naar Caribbean Bar's mosterdgeel/oceaanblauw, dus botsen anders).
- Vorm/ruimte/motion: hergebruikt, geen parallel systeem — `radius-brand-sm
  /-brand/-brand-lg` (16/20/24px), Tailwinds standaard-spacingschaal,
  `ease-brand` (cubic-bezier(0.22, 1, 0.36, 1)).
- Basiscomponenten: `Button` (`variant="gold"` = primair, `outline` =
  secundair, `ghost` = tertiair), `Card`/`CardHeader`/`CardTitle`/
  `CardDescription`/`CardContent`, `Badge` (tones incl. `gold`/`amber`/
  `sky`, zie hierboven), `Input` (`src/components/ui/input.tsx`, nieuw voor
  toekomstig werk — bestaande formulieren blijven hun eigen inline
  className gebruiken, niet migreren zonder reden).
