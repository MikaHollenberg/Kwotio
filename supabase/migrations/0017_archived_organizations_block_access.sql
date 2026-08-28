-- Gearchiveerde organisaties: gebruikers kunnen niet meer inloggen/hun data
-- benaderen (data blijft wel gewoon bewaard, in tegenstelling tot definitief
-- verwijderen). Dit is de databasekant van die blokkade (defense in depth,
-- naast de gebruiksvriendelijke uitlog + redirect in src/proxy.ts):
-- current_organization_id() levert null op zodra de organisatie van de
-- ingelogde gebruiker gearchiveerd is, waardoor alle bestaande org-scoped
-- RLS-policies (die stuk voor stuk via deze functie vergelijken) automatisch
-- geen rijen meer teruggeven.
create or replace function current_organization_id()
returns uuid
language sql stable
security definer
set search_path = public
as $$
  select p.organization_id
  from profiles p
  join organizations o on o.id = p.organization_id
  where p.id = auth.uid() and o.archived_at is null;
$$;
