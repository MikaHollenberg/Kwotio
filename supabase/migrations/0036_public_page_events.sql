-- Bezoekstatistieken voor de publieke organisatiepagina (/offertes/[slug]):
-- paginabezoeken, welke templates geopend worden, en hoe vaak het
-- aanvraagformulier geopend wordt (los van daadwerkelijk verstuurde
-- aanvragen, die al in quote_requests staan). Zelfde "geen anon-
-- insertpolicy, alleen via service-role"-patroon als quote_requests.
create type public_page_event_type as enum ('page_view', 'template_opened', 'request_form_opened');

create table public_page_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  template_id uuid references templates(id) on delete set null,
  type public_page_event_type not null,
  created_at timestamptz not null default now()
);
create index public_page_events_org_type_idx on public_page_events(organization_id, type, created_at);

alter table public_page_events enable row level security;

create policy "org members can read own public_page_events" on public_page_events for select
  using (organization_id = current_organization_id());
