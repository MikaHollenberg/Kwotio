-- Per-offerte kant van feature 2: of het "aantal personen"-invulveld voor
-- DEZE specifieke offerte actief is (alleen te zetten als de organisatie het
-- via Instellingen ook globaal heeft aangezet, zie migratie 0020), en het
-- aantal dat de klant daadwerkelijk heeft ingevuld op het moment van
-- ondertekenen.
alter table quotes
  add column aantal_personen_actief boolean not null default false,
  add column aantal_personen integer;
