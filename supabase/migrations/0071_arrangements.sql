-- Fase 2 (branche-features): herbruikbare arrangementen-catalogus per
-- organisatie -- naam/omschrijving/categorie/kleurcode/basisprijs, met
-- optioneel groepsafhankelijke staffelprijzen OF seizoensprijzen (één
-- prijsmodel per arrangement, geen combinatie van de twee -- houdt de
-- rekenlogica en de UI uitlegbaar), en een simpele beschikbaarheids-
-- kalender per datum. Geen geldbeweging op zich (dat gebeurt pas in een
-- offerte/factuur), dus het gewone "!= 'readonly'"-RLS-patroon zoals
-- block_templates/invoice_catalog_items.

create type arrangement_pricing_mode as enum ('vast', 'staffel', 'seizoen');
create type arrangement_availability_status as enum ('beschikbaar', 'bijna_vol', 'vol');

create table arrangements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  description text not null default '',
  category text not null default '',
  color_code text not null default '#B87F2A',
  base_price numeric(10,2) not null default 0,
  pricing_mode arrangement_pricing_mode not null default 'vast',
  sort_order integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger arrangements_set_updated_at before update on arrangements
  for each row execute function set_updated_at();
create index arrangements_organization_id_idx on arrangements(organization_id);

create table arrangement_price_tiers (
  id uuid primary key default gen_random_uuid(),
  arrangement_id uuid not null references arrangements(id) on delete cascade,
  min_guests integer not null check (min_guests > 0),
  max_guests integer, -- null = geen bovengrens (bv. "26+")
  price numeric(10,2) not null,
  sort_order integer not null default 0
);
create index arrangement_price_tiers_arrangement_id_idx on arrangement_price_tiers(arrangement_id);

create table arrangement_season_prices (
  id uuid primary key default gen_random_uuid(),
  arrangement_id uuid not null references arrangements(id) on delete cascade,
  label text not null,
  start_date date not null,
  end_date date not null,
  price numeric(10,2) not null,
  sort_order integer not null default 0,
  constraint arrangement_season_prices_date_order check (end_date >= start_date)
);
create index arrangement_season_prices_arrangement_id_idx on arrangement_season_prices(arrangement_id);

create table arrangement_availability (
  id uuid primary key default gen_random_uuid(),
  arrangement_id uuid not null references arrangements(id) on delete cascade,
  date date not null,
  status arrangement_availability_status not null,
  unique (arrangement_id, date)
);
create index arrangement_availability_arrangement_id_idx on arrangement_availability(arrangement_id);

alter table arrangements enable row level security;
alter table arrangement_price_tiers enable row level security;
alter table arrangement_season_prices enable row level security;
alter table arrangement_availability enable row level security;

create policy "org members can read own arrangements" on arrangements for select
  using (organization_id = current_organization_id());
create policy "org members can insert own arrangements" on arrangements for insert
  with check (organization_id = current_organization_id() and current_user_role() != 'readonly');
create policy "org members can update own arrangements" on arrangements for update
  using (organization_id = current_organization_id() and current_user_role() != 'readonly');
create policy "org members can delete own arrangements" on arrangements for delete
  using (organization_id = current_organization_id() and current_user_role() != 'readonly');

-- Kindtabellen: geen eigen organization_id, scope via de bijbehorende
-- arrangement -- zelfde patroon als quote_blocks/template_blocks.
create policy "org members can read own arrangement price tiers" on arrangement_price_tiers for select
  using (exists (select 1 from arrangements a where a.id = arrangement_id and a.organization_id = current_organization_id()));
create policy "org members can insert own arrangement price tiers" on arrangement_price_tiers for insert
  with check (exists (select 1 from arrangements a where a.id = arrangement_id and a.organization_id = current_organization_id() and current_user_role() != 'readonly'));
create policy "org members can update own arrangement price tiers" on arrangement_price_tiers for update
  using (exists (select 1 from arrangements a where a.id = arrangement_id and a.organization_id = current_organization_id() and current_user_role() != 'readonly'));
create policy "org members can delete own arrangement price tiers" on arrangement_price_tiers for delete
  using (exists (select 1 from arrangements a where a.id = arrangement_id and a.organization_id = current_organization_id() and current_user_role() != 'readonly'));

create policy "org members can read own arrangement season prices" on arrangement_season_prices for select
  using (exists (select 1 from arrangements a where a.id = arrangement_id and a.organization_id = current_organization_id()));
create policy "org members can insert own arrangement season prices" on arrangement_season_prices for insert
  with check (exists (select 1 from arrangements a where a.id = arrangement_id and a.organization_id = current_organization_id() and current_user_role() != 'readonly'));
create policy "org members can update own arrangement season prices" on arrangement_season_prices for update
  using (exists (select 1 from arrangements a where a.id = arrangement_id and a.organization_id = current_organization_id() and current_user_role() != 'readonly'));
create policy "org members can delete own arrangement season prices" on arrangement_season_prices for delete
  using (exists (select 1 from arrangements a where a.id = arrangement_id and a.organization_id = current_organization_id() and current_user_role() != 'readonly'));

create policy "org members can read own arrangement availability" on arrangement_availability for select
  using (exists (select 1 from arrangements a where a.id = arrangement_id and a.organization_id = current_organization_id()));
create policy "org members can insert own arrangement availability" on arrangement_availability for insert
  with check (exists (select 1 from arrangements a where a.id = arrangement_id and a.organization_id = current_organization_id() and current_user_role() != 'readonly'));
create policy "org members can update own arrangement availability" on arrangement_availability for update
  using (exists (select 1 from arrangements a where a.id = arrangement_id and a.organization_id = current_organization_id() and current_user_role() != 'readonly'));
create policy "org members can delete own arrangement availability" on arrangement_availability for delete
  using (exists (select 1 from arrangements a where a.id = arrangement_id and a.organization_id = current_organization_id() and current_user_role() != 'readonly'));
