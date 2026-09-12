-- Rollen scherper maken: Admin (= alles, zelfde niveau als Eigenaar),
-- Teamlid (dagelijks operationeel werk: offertes/klanten/aanvragen/
-- templates, geen instellingen/statistieken/teambeheer), Alleen-lezen
-- (overal alleen kijken). Deze migratie repareert twee losse, bij het
-- doordenken van dit rollenmodel ontdekte problemen:
--
-- 1. Rol wijzigen werkte niet: er was geen RLS-update-policy die een
--    eigenaar/admin toestond een ANDER teamlid se rij in `profiles` te
--    updaten (de enige update-policy was "id = auth.uid()" -- alleen je
--    eigen rij). `updateMemberRole()` liep dus stil op nul gewijzigde rijen.
-- 2. Die "id = auth.uid()"-policy had geen WITH CHECK: een ingelogde
--    gebruiker kon in theorie zijn eigen `role`/`organization_id` zelf
--    aanpassen (bijv. rechtstreeks via de API), en zelfs `is_super_admin`
--    zetten. Nu afgedwongen via een trigger (geldt voor élke rij, niet
--    alleen zelf-updates, en geldt niet voor service-role-verkeer zoals het
--    hoofdaccount, dat via `auth.role() = 'service_role'` buiten schot blijft).

create or replace function prevent_unsafe_profile_updates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'authenticated' and new.is_super_admin is distinct from old.is_super_admin then
    raise exception 'is_super_admin kan niet via de app gewijzigd worden.';
  end if;

  if auth.role() = 'authenticated' and new.id = auth.uid() then
    if new.role is distinct from old.role or new.organization_id is distinct from old.organization_id then
      raise exception 'Je kunt je eigen rol of organisatie niet zelf wijzigen.';
    end if;
  end if;

  return new;
end;
$$;

create trigger profiles_prevent_unsafe_updates
  before update on profiles
  for each row execute function prevent_unsafe_profile_updates();

create policy "owner/admin can update team profiles" on profiles for update
  using (organization_id = current_organization_id() and current_user_role() in ('owner', 'admin'))
  with check (organization_id = current_organization_id());

-- Gesloten dagen zijn onderdeel van Instellingen -> nu net als
-- organisatiegegevens/e-mailautomatisering owner/admin-only (was per ongeluk
-- "iedereen behalve alleen-lezen", net als de offerte/klant/template-tabellen).
alter policy "org members can insert own closed_dates" on closed_dates
  with check (organization_id = current_organization_id() and current_user_role() in ('owner', 'admin'));
alter policy "org members can delete own closed_dates" on closed_dates
  using (organization_id = current_organization_id() and current_user_role() in ('owner', 'admin'));
