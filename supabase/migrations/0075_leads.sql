-- Fase 3: leads -- een lichter contactmoment vóór de volledige, template-
-- gebonden offerte-aanvraag. Publieke bezoekers laten hier alleen contact-
-- gegevens + een korte indicatie achter (waarvoor, geschat aantal personen,
-- voorkeursdatum, optioneel bericht); het bureau zet een lead zelf om naar
-- een echte offerte-aanvraag (quote_requests), waar dan alsnog een template
-- gekozen wordt. Zelfde architectuur als quote_requests: geen insert-policy
-- voor ingelogde gebruikers, alleen de publieke service-role-flow (zie
-- src/app/offertes/[slug]/actions.ts) maakt rijen aan.
create type lead_purpose as enum ('uitje', 'arrangement', 'overig');
create type lead_status as enum ('nieuw', 'gecontacteerd', 'omgezet', 'afgewezen');

create table leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  company_name text,
  email text not null,
  phone text not null,
  purpose lead_purpose not null,
  guest_count integer not null,
  preferred_date date not null,
  message text,
  status lead_status not null default 'nieuw',
  converted_request_id uuid references quote_requests(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger leads_set_updated_at before update on leads
  for each row execute function set_updated_at();

alter table leads enable row level security;

create policy "org members can view leads"
  on leads for select
  using (organization_id = current_organization_id());

create policy "non-readonly members can update leads"
  on leads for update
  using (organization_id = current_organization_id() and current_user_role() != 'readonly');
