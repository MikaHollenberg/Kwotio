-- Fase 6: teamleden uitnodigen in een bestaande organisatie i.p.v. altijd een
-- nieuwe organisatie aan te maken bij een nieuwe auth.users-rij.

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
  invited_org_id uuid;
  invited_role user_role;
begin
  invited_org_id := nullif(new.raw_user_meta_data->>'organization_id', '')::uuid;
  invited_role := nullif(new.raw_user_meta_data->>'role', '')::user_role;

  if invited_org_id is not null then
    insert into profiles (id, organization_id, full_name, email, role)
    values (new.id, invited_org_id, new.raw_user_meta_data->>'full_name', new.email, coalesce(invited_role, 'member'));
  else
    insert into organizations (name, brand_name)
    values ('Feest aan het Water', 'Caribbean Bar Uitgeest')
    returning id into new_org_id;

    insert into profiles (id, organization_id, full_name, email, role)
    values (new.id, new_org_id, new.raw_user_meta_data->>'full_name', new.email, 'owner');
  end if;

  return new;
end;
$$;
