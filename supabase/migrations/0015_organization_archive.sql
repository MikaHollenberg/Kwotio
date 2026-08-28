-- Hoofdaccount, fase 3 (uitbreiding): organisaties archiveren en verwijderen.
-- "Archiveren" is bewust iets anders dan de bestaande status "opgezegd":
-- status beschrijft de klant-levenscyclus (nog gewoon zichtbaar in het
-- overzicht), archiveren haalt een organisatie uit het standaardoverzicht
-- (bijv. voor test-/duplicaat-organisaties) zonder data te verwijderen.

alter table organizations
  add column archived_at timestamptz;

create index organizations_archived_at_idx on organizations(archived_at);
