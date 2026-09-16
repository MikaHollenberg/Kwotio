-- Contactmomenten loggen per offerte (bv. "gebeld op 14 sept, klant belt na
-- het weekend terug") -- los van `comments`, want dit is puur intern en
-- nooit zichtbaar voor de klant. Append-only vanuit de UI (geen update-
-- policy): een logje wijzig je niet achteraf, je voegt een nieuwe toe.
-- Zelfde org-scoped RLS-patroon als comments (migratie 0007).

create table quote_contact_logs (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes(id) on delete cascade,
  author_name text not null,
  body text not null,
  created_at timestamptz not null default now()
);
create index quote_contact_logs_quote_id_idx on quote_contact_logs(quote_id);

alter table quote_contact_logs enable row level security;

create policy "org members can read own contact logs" on quote_contact_logs for select
  using (quote_id in (select id from quotes where organization_id = current_organization_id()));
create policy "org members can write own contact logs" on quote_contact_logs for insert
  with check (
    current_user_role() != 'readonly'
    and quote_id in (select id from quotes where organization_id = current_organization_id())
  );
create policy "org members can delete own contact logs" on quote_contact_logs for delete
  using (
    current_user_role() != 'readonly'
    and quote_id in (select id from quotes where organization_id = current_organization_id())
  );
