-- Handmatig sorteerbare volgorde voor templates, zelfde patroon als
-- arrangements.sort_order (migratie 0071) -- de publieke offertepagina
-- (src/app/offertes/[slug]/data.ts) toont "Onze offertes" al op basis
-- van deze kolom zodra 'm bestaat, geen aparte migratie daarvoor nodig.
alter table templates add column sort_order integer not null default 0;

-- Backfill: bestaande templates krijgen een oplopende sort_order per
-- organisatie, op volgorde van created_at, zodat de bestaande (impliciete)
-- volgorde niet door elkaar husselt zodra sort_order in gebruik genomen wordt.
with ranked as (
  select id, row_number() over (partition by organization_id order by created_at) - 1 as rn
  from templates
)
update templates t
set sort_order = ranked.rn
from ranked
where ranked.id = t.id;
