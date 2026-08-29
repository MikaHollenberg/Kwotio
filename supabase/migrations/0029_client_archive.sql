-- Klanten archiveren — zelfde patroon als organisaties archiveren
-- (migratie 0015): uit het standaardoverzicht halen zonder data te
-- verwijderen, terugdraaibaar. Los van "verwijderen" (definitief).

alter table clients add column archived_at timestamptz;
create index clients_archived_at_idx on clients(archived_at);
