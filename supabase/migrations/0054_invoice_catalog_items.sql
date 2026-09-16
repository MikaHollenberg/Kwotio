-- Fase 6-vervolg: factuurartikelen -- veelgebruikte regels (naam, prijs,
-- btw-tarief) opslaan en hergebruiken bij het samenstellen van een factuur
-- (offerte-gebonden of los). Geen geldbeweging op zich, puur een
-- naslaglijst -- volgt daarom het gewone "!= 'readonly'"-RLS-patroon
-- (teamlid mag beheren), niet de strengere owner/admin-only-regel die voor
-- facturen zelf geldt.
create type invoice_vat_rate_type as enum ('hoog', 'laag', 'nul', 'aangepast');

create table invoice_catalog_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  description text,
  unit_price numeric(10,2) not null default 0, -- excl. btw
  vat_rate_type invoice_vat_rate_type not null default 'hoog',
  vat_rate_custom numeric(5,2), -- alleen gebruikt als vat_rate_type = 'aangepast'
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger invoice_catalog_items_set_updated_at before update on invoice_catalog_items
  for each row execute function set_updated_at();
create index invoice_catalog_items_organization_id_idx on invoice_catalog_items(organization_id);

alter table invoice_catalog_items enable row level security;

create policy "org members can read own invoice catalog items" on invoice_catalog_items for select
  using (organization_id = current_organization_id());
create policy "org members can write own invoice catalog items" on invoice_catalog_items for insert
  with check (organization_id = current_organization_id() and current_user_role() != 'readonly');
create policy "org members can update own invoice catalog items" on invoice_catalog_items for update
  using (organization_id = current_organization_id() and current_user_role() != 'readonly');
create policy "org members can delete own invoice catalog items" on invoice_catalog_items for delete
  using (organization_id = current_organization_id() and current_user_role() != 'readonly');
