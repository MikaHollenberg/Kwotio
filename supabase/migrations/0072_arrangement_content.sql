-- Fase 2-vervolg: rijkere arrangementinhoud, direct gebaseerd op de
-- aangeleverde PDF-arrangementen (categorie-vakjes als "Bier"/"Wijn",
-- een vrije beschrijving, een optioneel actievak zoals "Tropical Deal!",
-- en extra's met een eigen prijs zoals de "Tips"-lijst). JSONB i.p.v.
-- losse tabellen -- deze inhoud wordt als geheel bewerkt in de editor en
-- als momentopname naar een offerteblok gekopieerd, zelfde aanpak als
-- PackagesBlockContent.packages/addons.
alter table arrangements
  add column inclusief_sections jsonb not null default '[]'::jsonb,
  add column highlight_title text,
  add column highlight_text text,
  add column extras jsonb not null default '[]'::jsonb;
