-- Templates archiveren — zelfde patroon als klanten archiveren (migratie
-- 0029): uit het standaardoverzicht en de templatekeuze bij nieuwe offertes
-- halen zonder data te verwijderen, terugdraaibaar. Los van "verwijderen"
-- (definitief) en los van de bestaande is_active-vlag (die blijft ongewijzigd
-- puur cosmetisch/al-bestaand gedrag).

alter table templates add column archived_at timestamptz;
create index templates_archived_at_idx on templates(archived_at);
