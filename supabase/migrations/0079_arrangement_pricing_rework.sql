-- Nieuw prijsmodel voor arrangementen: losse, benoembare prijsregels i.p.v.
-- één basisprijs + prijsmodel (vast/staffel/seizoen), seizoensprijzen als
-- eigen regelset per periode, en toeslagen op aantal personen die puur
-- informatief zijn (nooit automatisch verrekend -- er is voor het
-- toevoegmoment van een arrangement aan een offerte geen betrouwbaar bekend
-- aantal personen). Vervangt de "vul aantal personen in, zie totaalprijs"-
-- rekenmachine, die hiermee ook uit de UI verdwijnt.
--
-- Dit is bewust alleen het ADDITIEVE deel (nieuwe tabellen + datamigratie).
-- De destructieve opruiming van de oude kolommen/tabellen/enum staat apart
-- in 0080_arrangement_pricing_cleanup.sql, die de gebruiker zelf moet
-- draaien (de Claude Code auto-mode-classifier weigerde de DROP-statements
-- als één geheel met deze migratie).

create table arrangement_seasons (
  id uuid primary key default gen_random_uuid(),
  arrangement_id uuid not null references arrangements(id) on delete cascade,
  label text not null,
  start_date date not null,
  end_date date not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create table arrangement_prices (
  id uuid primary key default gen_random_uuid(),
  arrangement_id uuid not null references arrangements(id) on delete cascade,
  -- null = altijd actief; gezet = hoort bij dit seizoen en vervangt de
  -- "altijd actieve" regels zodra de offertedatum binnen die periode valt.
  season_id uuid references arrangement_seasons(id) on delete cascade,
  label text not null,
  unit text not null check (unit in ('vast', 'p.p.')),
  amount numeric(10, 2) not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table arrangement_surcharges (
  id uuid primary key default gen_random_uuid(),
  arrangement_id uuid not null references arrangements(id) on delete cascade,
  label text not null default '',
  min_guests int not null,
  max_guests int,
  unit text not null check (unit in ('vast', 'p.p.')),
  amount numeric(10, 2) not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  check (max_guests is null or max_guests >= min_guests)
);

alter table arrangement_seasons enable row level security;
alter table arrangement_prices enable row level security;
alter table arrangement_surcharges enable row level security;

-- Zelfde RLS-vorm als het bestaande arrangement_availability: select
-- org-scoped via het ouder-arrangement, schrijven alleen niet-readonly.
create policy "select arrangement_seasons in own org" on arrangement_seasons for select
  using (exists (select 1 from arrangements a where a.id = arrangement_id and a.organization_id = current_organization_id()));
create policy "insert arrangement_seasons in own org" on arrangement_seasons for insert
  with check (exists (select 1 from arrangements a where a.id = arrangement_id and a.organization_id = current_organization_id()) and current_user_role() != 'readonly');
create policy "update arrangement_seasons in own org" on arrangement_seasons for update
  using (exists (select 1 from arrangements a where a.id = arrangement_id and a.organization_id = current_organization_id()) and current_user_role() != 'readonly');
create policy "delete arrangement_seasons in own org" on arrangement_seasons for delete
  using (exists (select 1 from arrangements a where a.id = arrangement_id and a.organization_id = current_organization_id()) and current_user_role() != 'readonly');

create policy "select arrangement_prices in own org" on arrangement_prices for select
  using (exists (select 1 from arrangements a where a.id = arrangement_id and a.organization_id = current_organization_id()));
create policy "insert arrangement_prices in own org" on arrangement_prices for insert
  with check (exists (select 1 from arrangements a where a.id = arrangement_id and a.organization_id = current_organization_id()) and current_user_role() != 'readonly');
create policy "update arrangement_prices in own org" on arrangement_prices for update
  using (exists (select 1 from arrangements a where a.id = arrangement_id and a.organization_id = current_organization_id()) and current_user_role() != 'readonly');
create policy "delete arrangement_prices in own org" on arrangement_prices for delete
  using (exists (select 1 from arrangements a where a.id = arrangement_id and a.organization_id = current_organization_id()) and current_user_role() != 'readonly');

create policy "select arrangement_surcharges in own org" on arrangement_surcharges for select
  using (exists (select 1 from arrangements a where a.id = arrangement_id and a.organization_id = current_organization_id()));
create policy "insert arrangement_surcharges in own org" on arrangement_surcharges for insert
  with check (exists (select 1 from arrangements a where a.id = arrangement_id and a.organization_id = current_organization_id()) and current_user_role() != 'readonly');
create policy "update arrangement_surcharges in own org" on arrangement_surcharges for update
  using (exists (select 1 from arrangements a where a.id = arrangement_id and a.organization_id = current_organization_id()) and current_user_role() != 'readonly');
create policy "delete arrangement_surcharges in own org" on arrangement_surcharges for delete
  using (exists (select 1 from arrangements a where a.id = arrangement_id and a.organization_id = current_organization_id()) and current_user_role() != 'readonly');

-- Datamigratie: bestaande base_price/price_per_person -> 1 prijsregel;
-- bestaande staffel-tiers -> toeslagen (bedrag = tier-prijs minus
-- basisprijs); bestaande seizoensprijzen -> arrangement_seasons + hun eigen
-- prijsregel.
insert into arrangement_prices (arrangement_id, label, unit, amount, sort_order)
select id, 'Prijs', case when price_per_person then 'p.p.' else 'vast' end, base_price, 0
from arrangements;

insert into arrangement_surcharges (arrangement_id, label, min_guests, max_guests, unit, amount, sort_order)
select t.arrangement_id, '', t.min_guests, t.max_guests,
       case when a.price_per_person then 'p.p.' else 'vast' end,
       greatest(t.price - a.base_price, 0), t.sort_order
from arrangement_price_tiers t
join arrangements a on a.id = t.arrangement_id
where t.price > a.base_price;

with inserted_seasons as (
  insert into arrangement_seasons (arrangement_id, label, start_date, end_date, sort_order)
  select arrangement_id, label, start_date, end_date, sort_order from arrangement_season_prices
  returning id, arrangement_id, label, start_date, end_date
)
insert into arrangement_prices (arrangement_id, season_id, label, unit, amount, sort_order)
select s.arrangement_id, s.id, 'Prijs', case when a.price_per_person then 'p.p.' else 'vast' end, sp.price, 0
from arrangement_season_prices sp
join inserted_seasons s
  on s.arrangement_id = sp.arrangement_id and s.label = sp.label
  and s.start_date = sp.start_date and s.end_date = sp.end_date
join arrangements a on a.id = sp.arrangement_id;
