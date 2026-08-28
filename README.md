# Caribbean Bar Uitgeest — offerte- & klantportaal

Offerte- en klantportaal voor Feest aan het Water (klant-facing merknaam:
Caribbean Bar Uitgeest). Zie het opdrachtdocument voor de volledige scope.

**Status: Fase 1 — Fundament & design-systeem.**

## Wat staat er al

- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- Merk-theme in [`src/app/globals.css`](src/app/globals.css): volledige kleurschalen
  (blue/orange/yellow/teal/sand/ink) afgeleid van de officiële logo-hexwaarden,
  plus Bricolage Grotesque (display) en Manrope (body) via `next/font/google`
- Merkassets verwerkt in [`public/brand/`](public/brand/) (bijgesneden op
  inhoud, max. 1800px, transparante achtergrond behouden)
- Supabase-datamodel voor de volledige opdracht (sectie 4) in
  [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql),
  incl. Row Level Security per organisatie
- Auth voor bureau-gebruikers (inloggen/uitloggen) via Supabase Auth. Geen
  publieke zelfregistratie — nieuwe teamleden worden uitsluitend door een
  bestaande owner/admin uitgenodigd (Instellingen → team), zie HANDOVER.md.
- Lege dashboard-shell: sidebar, topbar, en placeholder-pagina's voor
  Offertes, Klanten, Templates, Statistieken; Instellingen toont al echte
  organisatie- en huisstijlgegevens

## Setup

1. Maak een gratis project aan op [supabase.com](https://supabase.com).
2. Kopieer `.env.local.example` naar `.env.local` en vul de sleutels in
   (Project Settings → API in het Supabase-dashboard).
3. Voer de migratie uit: open de SQL Editor in het Supabase-dashboard en
   plak de inhoud van `supabase/migrations/0001_init.sql`, of gebruik de
   Supabase CLI:
   ```bash
   npx supabase link --project-ref <jouw-project-ref>
   npx supabase db push
   ```
4. Installeer dependencies en start de dev-server:
   ```bash
   npm install
   npm run dev
   ```
5. Het allereerste (eigenaar-)account is al aangemaakt — er is bewust geen
   publieke registratiepagina meer (verwijderd om onbevoegde zelfregistratie
   te voorkomen). Nieuwe accounts kunnen alleen door een ingelogde owner/admin
   via Instellingen → team worden uitgenodigd
   (`auth.admin.inviteUserByEmail`, ziet de bestaande organisatie).

## Belangrijk: dit is Next.js 16

Deze Next.js-versie bevat breaking changes t.o.v. eerdere versies (o.a.
`middleware.ts` → `src/proxy.ts`, getypte `LayoutProps`). Zie
`node_modules/next/dist/docs/` voor de actuele documentatie voordat je nieuwe
routes/conventies toevoegt.

## Volgende fase

Fase 2 — Offerte-builder + templates: blok-editor, pakketten/prijstabel met
opties, template-bibliotheek, live preview.
