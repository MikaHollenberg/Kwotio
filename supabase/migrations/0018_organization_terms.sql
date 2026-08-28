-- Elke organisatie kan een eigen algemene-voorwaarden-PDF uploaden i.p.v. de
-- vaste Caribbean Bar-tekst die tot nu toe overal hardcoded stond. Nullable,
-- geen default: nieuwe/bestaande organisaties starten leeg en moeten zelf
-- uploaden (zie app/src/app/dashboard/instellingen/organization-settings-card.tsx).
-- Caribbean Bar Uitgeest krijgt hier bewust GEEN automatische migratie voor —
-- dat account uploadt de eigen PDF handmatig zodra de functionaliteit klaar is.

alter table organizations
  add column terms_url text;
