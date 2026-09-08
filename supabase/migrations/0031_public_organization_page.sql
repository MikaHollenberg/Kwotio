-- Publieke, niet-ingelogde organisatiepagina (/offertes/[slug]): elke
-- organisatie krijgt een leesbare, unieke slug + een instelbaar
-- "aantal personen"-veld voor het nieuwe offerte-aanvraagformulier daar.
-- Templates krijgen een aparte publiek-zichtbaar-vlag, los van de bestaande
-- `is_active` (die betekent alleen "selecteerbaar bij een nieuwe offerte in
-- het dashboard", niet "zichtbaar voor de hele wereld").

alter table organizations add column public_slug text;
alter table organizations add column guest_count_field_active boolean not null default false;
alter table organizations add column guest_count_field_label text;

-- Backfill: slug afgeleid van brand_name/name (lowercase, niet-alfanumeriek
-- naar "-", dashes getrimd), met een oplopend suffix bij een naamsbotsing.
with slugged as (
  select
    id,
    regexp_replace(
      regexp_replace(lower(trim(coalesce(nullif(brand_name, ''), name))), '[^a-z0-9]+', '-', 'g'),
      '(^-+|-+$)', '', 'g'
    ) as base_slug
  from organizations
),
numbered as (
  select id, base_slug, row_number() over (partition by base_slug order by id) as rn
  from slugged
)
update organizations o
set public_slug = case when n.rn = 1 then n.base_slug else n.base_slug || '-' || n.rn end
from numbered n
where o.id = n.id;

alter table organizations alter column public_slug set not null;
create unique index organizations_public_slug_idx on organizations(public_slug);

alter table templates add column is_publicly_visible boolean not null default false;
create index templates_public_visibility_idx on templates(organization_id, is_publicly_visible);
