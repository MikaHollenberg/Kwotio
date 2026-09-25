-- Arrangementen-module afgerond (Fase 2 was nog niet gelanceerd, zie
-- 0074's eigen notitie): prijs-per-persoon als los vinkje (niet als 4e
-- prijsmodus naast vast/staffel/seizoen -- elk bestaand model kan zo ook
-- "per persoon" zijn, zelfde principe als quotes.price_per_person),
-- incl./excl. btw (hergebruikt price_display_mode, al bestaand voor
-- offertes), en een publiek-zichtbaar-vinkje voor de publieke
-- organisatiepagina (zelfde patroon als templates.is_publicly_visible,
-- migratie 0031).

alter table arrangements
  add column price_per_person boolean not null default false,
  add column price_display price_display_mode not null default 'excl_btw',
  add column is_publicly_visible boolean not null default false;

create index arrangements_public_idx on arrangements(organization_id, is_publicly_visible);
