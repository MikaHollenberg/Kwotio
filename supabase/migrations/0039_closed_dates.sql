-- Gesloten dagen per organisatie: data waarop de organisatie sowieso dicht
-- is, zodat een klant die datum niet eens kan kiezen op de publieke
-- aanvraagpagina. Simpele losse tabel (net als quote_requests/email_
-- automation_rules) i.p.v. een array-kolom, zodat elke datum een eigen
-- optionele toelichting kan hebben en makkelijk los toe te voegen/te
-- verwijderen is.

create table closed_dates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  date date not null,
  reason text,
  created_at timestamptz not null default now(),
  unique (organization_id, date)
);

create index closed_dates_organization_date_idx on closed_dates(organization_id, date);

alter table closed_dates enable row level security;

create policy "org members can read own closed_dates" on closed_dates for select
  using (organization_id = current_organization_id());
create policy "org members can insert own closed_dates" on closed_dates for insert
  with check (organization_id = current_organization_id() and current_user_role() != 'readonly');
create policy "org members can delete own closed_dates" on closed_dates for delete
  using (organization_id = current_organization_id() and current_user_role() != 'readonly');
