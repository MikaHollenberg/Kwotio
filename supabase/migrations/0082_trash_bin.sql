-- Prullenbak: offertes en klanten blijven na "verwijderen" 30 dagen
-- herstelbaar i.p.v. direct definitief weg te zijn.

alter table quotes add column deleted_at timestamptz;
alter table clients add column deleted_at timestamptz;

create index quotes_deleted_at_idx on quotes (deleted_at) where deleted_at is not null;
create index clients_deleted_at_idx on clients (deleted_at) where deleted_at is not null;

-- Zachtverwijderde rijen vallen automatisch weg uit elke gewone
-- (niet-service-role) lezing door de hele app heen -- geen los filter nodig
-- op elke bestaande select-aanroep. De prullenbak-pagina's lezen zelf via
-- de service-role-client (zelfde patroon als de admin-queries) om de
-- verwijderde rijen juist wél te zien.
drop policy "org members can read own quotes" on quotes;
create policy "org members can read own quotes" on quotes
  for select using (organization_id = current_organization_id() and deleted_at is null);

drop policy "org members can read own clients" on clients;
create policy "org members can read own clients" on clients
  for select using (organization_id = current_organization_id() and deleted_at is null);
