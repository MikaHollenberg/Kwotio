-- Hoofdaccount / multi-tenant beheer, fase 1: datamodel.
-- Uitbreiding op het al bestaande multi-tenant fundament (organizations +
-- organization_id + RLS sinds 0001/0007) — geen nieuwe koppeltabel nodig,
-- profiles (organization_id + role) is al de facto de sub-account-koppeling.

-- ---------------------------------------------------------------------------
-- organizations: klant-lifecycle + abonnement + extra bedrijfsgegevens
-- ---------------------------------------------------------------------------
create type org_status as enum ('proefperiode', 'actief', 'opgezegd');

alter table organizations
  add column status org_status not null default 'proefperiode',
  add column plan text,
  add column monthly_price numeric(10,2) not null default 0,
  add column iban text,
  add column contact_email text,
  add column contact_phone text;

-- Caribbean Bar is geen proefperiode-klant maar de bestaande, actieve gebruiker.
update organizations set status = 'actief' where brand_name = 'Caribbean Bar Uitgeest';

-- ---------------------------------------------------------------------------
-- super admin: vlag op profiles (geen losse app_admins-tabel nodig)
-- ---------------------------------------------------------------------------
alter table profiles
  add column is_super_admin boolean not null default false;

create or replace function is_super_admin()
returns boolean
language sql stable
security definer
set search_path = public
as $$
  select coalesce((select is_super_admin from profiles where id = auth.uid()), false);
$$;

-- Interne organisatie voor het super-admin-profiel zelf (profiles.organization_id
-- is not null, dus ook een super admin heeft een organisatie nodig — deze doet
-- verder nergens aan mee in de klant-statistieken).
insert into organizations (name, brand_name, status, plan)
values ('Platform', 'Hoofdaccount', 'actief', 'intern');

-- ---------------------------------------------------------------------------
-- super admins mogen alles lezen (aanvullend op, niet i.p.v. de bestaande
-- org-scoped policies — Postgres OR't permissive policies, dus dit kan de
-- bestaande isolatie tussen klant-organisaties niet doorbreken).
-- ---------------------------------------------------------------------------
create policy "super admins can read all organizations"
  on organizations for select
  using (is_super_admin());

create policy "super admins can update all organizations"
  on organizations for update
  using (is_super_admin());

create policy "super admins can read all profiles"
  on profiles for select
  using (is_super_admin());

-- ---------------------------------------------------------------------------
-- HANDMATIGE STAP — los uitvoeren na deze migratie, met je eigen inlog-e-mail:
-- (kan niet in de migratie zelf, die kent je auth-gebruiker niet)
-- ---------------------------------------------------------------------------
-- update profiles
-- set is_super_admin = true,
--     organization_id = (select id from organizations where name = 'Platform')
-- where email = 'hollenbergmika@gmail.com';
