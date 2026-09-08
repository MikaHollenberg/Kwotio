-- Offerte-aanvragen vanaf de publieke organisatiepagina (/offertes/[slug]).
-- Publieke bezoekers hebben geen account en dus geen anon-RLS-insertpolicy
-- nodig/gewenst hier -- inserts lopen uitsluitend via de service-role client
-- in de server action (zelfde "share_token = enige sleutel"-filosofie als de
-- rest van de publieke acties, alleen is er hier geen token: elke aanvraag
-- is een nieuwe, losse rij, niet een bestaand record dat opgezocht wordt).

create type quote_request_status as enum ('nieuw', 'in_behandeling', 'omgezet', 'genegeerd');

create table quote_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  template_id uuid references templates(id) on delete set null,
  customer_name text not null,
  customer_email text,
  customer_phone text,
  customer_company text,
  guest_count integer,
  desired_date date,
  notes text,
  status quote_request_status not null default 'nieuw',
  converted_quote_id uuid references quotes(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quote_requests_contact_required check (customer_email is not null or customer_phone is not null)
);

create trigger quote_requests_set_updated_at before update on quote_requests
  for each row execute function set_updated_at();
create index quote_requests_organization_status_idx on quote_requests(organization_id, status);

alter table quote_requests enable row level security;

-- Geen insert-policy: publieke aanvragen lopen via de service-role client.
create policy "org members can read own quote_requests" on quote_requests for select
  using (organization_id = current_organization_id());
create policy "org members can update own quote_requests" on quote_requests for update
  using (organization_id = current_organization_id() and current_user_role() != 'readonly');
