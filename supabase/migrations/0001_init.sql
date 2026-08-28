-- Caribbean Bar Uitgeest / Feest aan het Water — offerte- & klantportaal
-- Fase 1: basis-datamodel (sectie 4 van de opdracht)
-- Public-facing (share-token) read/write policies volgen in Fase 3 via SECURITY DEFINER RPC's.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- helper: updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- organizations — het bureau zelf
-- ---------------------------------------------------------------------------
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Feest aan het Water',
  brand_name text not null default 'Caribbean Bar Uitgeest',
  domain text default 'feestaanhetwater.nl',
  kvk_number text,
  btw_number text,
  address jsonb,
  logo_url text,
  brand_theme jsonb not null default '{}'::jsonb, -- per-organisatie overschrijfbare kleuren/fonts
  default_vat_rate numeric(5,2) not null default 21.00,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger organizations_set_updated_at before update on organizations
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- profiles — teamlid, 1:1 met auth.users, gekoppeld aan organization
-- ---------------------------------------------------------------------------
create type user_role as enum ('owner', 'admin', 'member', 'readonly');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  full_name text,
  email text not null,
  role user_role not null default 'member',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_set_updated_at before update on profiles
  for each row execute function set_updated_at();

create index profiles_organization_id_idx on profiles(organization_id);

-- helper used throughout RLS policies
create or replace function current_organization_id()
returns uuid
language sql stable
security definer
set search_path = public
as $$
  select organization_id from profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- clients — klant-CRM-lite
-- ---------------------------------------------------------------------------
create table clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger clients_set_updated_at before update on clients
  for each row execute function set_updated_at();
create index clients_organization_id_idx on clients(organization_id);

-- ---------------------------------------------------------------------------
-- templates — herbruikbare basis voor nieuwe quotes
-- ---------------------------------------------------------------------------
create type event_type as enum (
  'bedrijfsuitje', 'vrijgezellenfeest', 'trouwerij', 'familiedag', 'teambuilding', 'overig'
);

create table templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  event_type event_type not null default 'overig',
  description text,
  thumbnail_url text,
  language text not null default 'nl',
  is_active boolean not null default true,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger templates_set_updated_at before update on templates
  for each row execute function set_updated_at();
create index templates_organization_id_idx on templates(organization_id);

-- ---------------------------------------------------------------------------
-- blocks — bloktype content, herbruikbaar op een Template of op een Quote
-- owner_type/owner_id patroon zodat hetzelfde bloktype-systeem voor beide geldt
-- ---------------------------------------------------------------------------
create type block_type as enum (
  'cover', 'text', 'gallery', 'packages', 'timeline', 'terms', 'signature'
);

create table template_blocks (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references templates(id) on delete cascade,
  type block_type not null,
  position integer not null default 0,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger template_blocks_set_updated_at before update on template_blocks
  for each row execute function set_updated_at();
create index template_blocks_template_id_idx on template_blocks(template_id);

-- ---------------------------------------------------------------------------
-- quotes — de offerte
-- ---------------------------------------------------------------------------
create type quote_status as enum (
  'concept', 'verzonden', 'bekeken', 'in_overleg', 'geaccepteerd', 'verlopen', 'geweigerd'
);

create table quotes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  template_id uuid references templates(id) on delete set null, -- null = losgekoppeld / vanaf nul
  title text not null,
  status quote_status not null default 'concept',
  language text not null default 'nl',
  currency text not null default 'EUR',
  event_date date,
  valid_until date,
  vat_rate numeric(5,2) not null default 21.00,
  subtotal numeric(10,2) not null default 0,
  discount_amount numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  share_token text not null unique default regexp_replace(
    replace(replace(encode(gen_random_bytes(24), 'base64'), '+', '-'), '/', '_'),
    '=+$', ''
  ),
  access_code text,
  brand_override jsonb not null default '{}'::jsonb,
  created_by uuid references profiles(id) on delete set null,
  sent_at timestamptz,
  first_viewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger quotes_set_updated_at before update on quotes
  for each row execute function set_updated_at();
create index quotes_organization_id_idx on quotes(organization_id);
create index quotes_client_id_idx on quotes(client_id);
create index quotes_status_idx on quotes(status);
create unique index quotes_share_token_idx on quotes(share_token);

create table quote_blocks (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes(id) on delete cascade,
  type block_type not null,
  position integer not null default 0,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger quote_blocks_set_updated_at before update on quote_blocks
  for each row execute function set_updated_at();
create index quote_blocks_quote_id_idx on quote_blocks(quote_id);

-- packages & line items binnen een 'packages'-blok (genormaliseerd t.b.v. rapportage/statistieken)
create table quote_packages (
  id uuid primary key default gen_random_uuid(),
  quote_block_id uuid not null references quote_blocks(id) on delete cascade,
  name text not null,
  description text,
  photo_url text,
  price numeric(10,2) not null default 0,
  is_default_selected boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger quote_packages_set_updated_at before update on quote_packages
  for each row execute function set_updated_at();
create index quote_packages_quote_block_id_idx on quote_packages(quote_block_id);

create table quote_addons (
  id uuid primary key default gen_random_uuid(),
  quote_block_id uuid not null references quote_blocks(id) on delete cascade,
  package_id uuid references quote_packages(id) on delete cascade, -- null = losse optie, niet gebonden aan 1 pakket
  name text not null,
  description text,
  price numeric(10,2) not null default 0,
  quantity_editable boolean not null default false,
  default_quantity integer not null default 1,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger quote_addons_set_updated_at before update on quote_addons
  for each row execute function set_updated_at();
create index quote_addons_quote_block_id_idx on quote_addons(quote_block_id);

-- ---------------------------------------------------------------------------
-- quote_versions — snapshot bij versturen/na revisie (audit trail)
-- ---------------------------------------------------------------------------
create type quote_version_reason as enum ('sent', 'revised', 'signed');

create table quote_versions (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes(id) on delete cascade,
  version_number integer not null,
  snapshot jsonb not null, -- volledige bevroren offerte-inhoud zoals getoond/getekend
  total numeric(10,2) not null,
  reason quote_version_reason not null,
  created_at timestamptz not null default now(),
  unique (quote_id, version_number)
);
create index quote_versions_quote_id_idx on quote_versions(quote_id);

-- ---------------------------------------------------------------------------
-- comments — reacties per blok, klant of bureau
-- ---------------------------------------------------------------------------
create type comment_author_type as enum ('client', 'agency');

create table comments (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes(id) on delete cascade,
  block_id uuid references quote_blocks(id) on delete set null,
  author_type comment_author_type not null,
  author_name text not null,
  author_user_id uuid references profiles(id) on delete set null,
  body text not null,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);
create index comments_quote_id_idx on comments(quote_id);

-- ---------------------------------------------------------------------------
-- activity_events — logging t.b.v. dashboard-statistieken/engagement
-- ---------------------------------------------------------------------------
create type activity_event_type as enum (
  'sent', 'viewed', 'section_viewed', 'option_changed', 'comment_added',
  'signed', 'reminder_sent', 'downloaded_pdf'
);

create table activity_events (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes(id) on delete cascade,
  type activity_event_type not null,
  metadata jsonb not null default '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);
create index activity_events_quote_id_idx on activity_events(quote_id);
create index activity_events_type_idx on activity_events(type);

-- ---------------------------------------------------------------------------
-- signatures — SES-ondertekening + audit-gegevens (sectie 3.6)
-- ---------------------------------------------------------------------------
create type signature_method as enum ('canvas', 'typed');

create table signatures (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes(id) on delete cascade,
  quote_version_id uuid not null references quote_versions(id) on delete cascade,
  signer_name text not null,
  signer_email text not null,
  method signature_method not null,
  signature_image_url text,
  typed_name text,
  ip_address text not null,
  user_agent text not null,
  document_hash text not null, -- sha-256 van exact het getekende document
  certificate_pdf_url text,
  signed_at timestamptz not null default now()
);
create index signatures_quote_id_idx on signatures(quote_id);

-- ---------------------------------------------------------------------------
-- Row Level Security — bureau-gebruikers zien uitsluitend hun eigen organisatie.
-- Publieke klant-toegang via share_token wordt in Fase 3 toegevoegd via
-- SECURITY DEFINER RPC-functies (geen rechtstreekse anon-RLS op deze tabellen).
-- ---------------------------------------------------------------------------
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table clients enable row level security;
alter table templates enable row level security;
alter table template_blocks enable row level security;
alter table quotes enable row level security;
alter table quote_blocks enable row level security;
alter table quote_packages enable row level security;
alter table quote_addons enable row level security;
alter table quote_versions enable row level security;
alter table comments enable row level security;
alter table activity_events enable row level security;
alter table signatures enable row level security;

create policy "org members can read own organization"
  on organizations for select
  using (id = current_organization_id());

create policy "org members can update own organization"
  on organizations for update
  using (id = current_organization_id());

create policy "org members can read profiles in own organization"
  on profiles for select
  using (organization_id = current_organization_id());

create policy "users can update own profile"
  on profiles for update
  using (id = auth.uid());

create policy "org members can manage own clients"
  on clients for all
  using (organization_id = current_organization_id())
  with check (organization_id = current_organization_id());

create policy "org members can manage own templates"
  on templates for all
  using (organization_id = current_organization_id())
  with check (organization_id = current_organization_id());

create policy "org members can manage own template_blocks"
  on template_blocks for all
  using (template_id in (select id from templates where organization_id = current_organization_id()))
  with check (template_id in (select id from templates where organization_id = current_organization_id()));

create policy "org members can manage own quotes"
  on quotes for all
  using (organization_id = current_organization_id())
  with check (organization_id = current_organization_id());

create policy "org members can manage own quote_blocks"
  on quote_blocks for all
  using (quote_id in (select id from quotes where organization_id = current_organization_id()))
  with check (quote_id in (select id from quotes where organization_id = current_organization_id()));

create policy "org members can manage own quote_packages"
  on quote_packages for all
  using (quote_block_id in (
    select qb.id from quote_blocks qb join quotes q on q.id = qb.quote_id
    where q.organization_id = current_organization_id()
  ))
  with check (quote_block_id in (
    select qb.id from quote_blocks qb join quotes q on q.id = qb.quote_id
    where q.organization_id = current_organization_id()
  ));

create policy "org members can manage own quote_addons"
  on quote_addons for all
  using (quote_block_id in (
    select qb.id from quote_blocks qb join quotes q on q.id = qb.quote_id
    where q.organization_id = current_organization_id()
  ))
  with check (quote_block_id in (
    select qb.id from quote_blocks qb join quotes q on q.id = qb.quote_id
    where q.organization_id = current_organization_id()
  ));

create policy "org members can read own quote_versions"
  on quote_versions for select
  using (quote_id in (select id from quotes where organization_id = current_organization_id()));

create policy "org members can manage own comments"
  on comments for all
  using (quote_id in (select id from quotes where organization_id = current_organization_id()))
  with check (quote_id in (select id from quotes where organization_id = current_organization_id()));

create policy "org members can read own activity_events"
  on activity_events for select
  using (quote_id in (select id from quotes where organization_id = current_organization_id()));

create policy "org members can read own signatures"
  on signatures for select
  using (quote_id in (select id from quotes where organization_id = current_organization_id()));

-- ---------------------------------------------------------------------------
-- nieuwe auth.users -> automatisch profiel + organisatie (eerste gebruiker = owner)
-- ---------------------------------------------------------------------------
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
begin
  insert into organizations (name, brand_name)
  values ('Feest aan het Water', 'Caribbean Bar Uitgeest')
  returning id into new_org_id;

  insert into profiles (id, organization_id, full_name, email, role)
  values (new.id, new_org_id, new.raw_user_meta_data->>'full_name', new.email, 'owner');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
