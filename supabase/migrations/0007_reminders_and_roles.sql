-- Fase 6: instelbare hersteltermijn voor herinneringsmails + rolgebaseerde
-- RLS (alleen-lezen teamleden mogen niets aanpassen).

alter table organizations
  add column reminder_after_days integer not null default 3;

-- ---------------------------------------------------------------------------
-- Rolgebaseerde schrijfbeveiliging: 'readonly' mag alles in de eigen
-- organisatie lezen (bestaande policies), maar niets aanmaken/wijzigen/
-- verwijderen. We vervangen de brede "for all"-policies door aparte
-- select/insert/update/delete-policies die schrijven voor readonly blokkeren.
-- ---------------------------------------------------------------------------

create or replace function current_user_role()
returns user_role
language sql stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

-- clients
drop policy if exists "org members can manage own clients" on clients;
create policy "org members can read own clients" on clients for select
  using (organization_id = current_organization_id());
create policy "org members can write own clients" on clients for insert
  with check (organization_id = current_organization_id() and current_user_role() != 'readonly');
create policy "org members can update own clients" on clients for update
  using (organization_id = current_organization_id() and current_user_role() != 'readonly');
create policy "org members can delete own clients" on clients for delete
  using (organization_id = current_organization_id() and current_user_role() != 'readonly');

-- templates
drop policy if exists "org members can manage own templates" on templates;
create policy "org members can read own templates" on templates for select
  using (organization_id = current_organization_id());
create policy "org members can write own templates" on templates for insert
  with check (organization_id = current_organization_id() and current_user_role() != 'readonly');
create policy "org members can update own templates" on templates for update
  using (organization_id = current_organization_id() and current_user_role() != 'readonly');
create policy "org members can delete own templates" on templates for delete
  using (organization_id = current_organization_id() and current_user_role() != 'readonly');

-- template_blocks
drop policy if exists "org members can manage own template_blocks" on template_blocks;
create policy "org members can read own template_blocks" on template_blocks for select
  using (template_id in (select id from templates where organization_id = current_organization_id()));
create policy "org members can write own template_blocks" on template_blocks for insert
  with check (
    current_user_role() != 'readonly'
    and template_id in (select id from templates where organization_id = current_organization_id())
  );
create policy "org members can update own template_blocks" on template_blocks for update
  using (
    current_user_role() != 'readonly'
    and template_id in (select id from templates where organization_id = current_organization_id())
  );
create policy "org members can delete own template_blocks" on template_blocks for delete
  using (
    current_user_role() != 'readonly'
    and template_id in (select id from templates where organization_id = current_organization_id())
  );

-- quotes
drop policy if exists "org members can manage own quotes" on quotes;
create policy "org members can read own quotes" on quotes for select
  using (organization_id = current_organization_id());
create policy "org members can write own quotes" on quotes for insert
  with check (organization_id = current_organization_id() and current_user_role() != 'readonly');
create policy "org members can update own quotes" on quotes for update
  using (organization_id = current_organization_id() and current_user_role() != 'readonly');
create policy "org members can delete own quotes" on quotes for delete
  using (organization_id = current_organization_id() and current_user_role() != 'readonly');

-- quote_blocks
drop policy if exists "org members can manage own quote_blocks" on quote_blocks;
create policy "org members can read own quote_blocks" on quote_blocks for select
  using (quote_id in (select id from quotes where organization_id = current_organization_id()));
create policy "org members can write own quote_blocks" on quote_blocks for insert
  with check (
    current_user_role() != 'readonly'
    and quote_id in (select id from quotes where organization_id = current_organization_id())
  );
create policy "org members can update own quote_blocks" on quote_blocks for update
  using (
    current_user_role() != 'readonly'
    and quote_id in (select id from quotes where organization_id = current_organization_id())
  );
create policy "org members can delete own quote_blocks" on quote_blocks for delete
  using (
    current_user_role() != 'readonly'
    and quote_id in (select id from quotes where organization_id = current_organization_id())
  );

-- quote_packages
drop policy if exists "org members can manage own quote_packages" on quote_packages;
create policy "org members can read own quote_packages" on quote_packages for select
  using (quote_block_id in (
    select qb.id from quote_blocks qb join quotes q on q.id = qb.quote_id
    where q.organization_id = current_organization_id()
  ));
create policy "org members can write own quote_packages" on quote_packages for insert
  with check (
    current_user_role() != 'readonly'
    and quote_block_id in (
      select qb.id from quote_blocks qb join quotes q on q.id = qb.quote_id
      where q.organization_id = current_organization_id()
    )
  );
create policy "org members can update own quote_packages" on quote_packages for update
  using (
    current_user_role() != 'readonly'
    and quote_block_id in (
      select qb.id from quote_blocks qb join quotes q on q.id = qb.quote_id
      where q.organization_id = current_organization_id()
    )
  );
create policy "org members can delete own quote_packages" on quote_packages for delete
  using (
    current_user_role() != 'readonly'
    and quote_block_id in (
      select qb.id from quote_blocks qb join quotes q on q.id = qb.quote_id
      where q.organization_id = current_organization_id()
    )
  );

-- quote_addons
drop policy if exists "org members can manage own quote_addons" on quote_addons;
create policy "org members can read own quote_addons" on quote_addons for select
  using (quote_block_id in (
    select qb.id from quote_blocks qb join quotes q on q.id = qb.quote_id
    where q.organization_id = current_organization_id()
  ));
create policy "org members can write own quote_addons" on quote_addons for insert
  with check (
    current_user_role() != 'readonly'
    and quote_block_id in (
      select qb.id from quote_blocks qb join quotes q on q.id = qb.quote_id
      where q.organization_id = current_organization_id()
    )
  );
create policy "org members can update own quote_addons" on quote_addons for update
  using (
    current_user_role() != 'readonly'
    and quote_block_id in (
      select qb.id from quote_blocks qb join quotes q on q.id = qb.quote_id
      where q.organization_id = current_organization_id()
    )
  );
create policy "org members can delete own quote_addons" on quote_addons for delete
  using (
    current_user_role() != 'readonly'
    and quote_block_id in (
      select qb.id from quote_blocks qb join quotes q on q.id = qb.quote_id
      where q.organization_id = current_organization_id()
    )
  );

-- comments (bureau-kant reageren)
drop policy if exists "org members can manage own comments" on comments;
create policy "org members can read own comments" on comments for select
  using (quote_id in (select id from quotes where organization_id = current_organization_id()));
create policy "org members can write own comments" on comments for insert
  with check (
    current_user_role() != 'readonly'
    and quote_id in (select id from quotes where organization_id = current_organization_id())
  );
create policy "org members can update own comments" on comments for update
  using (
    current_user_role() != 'readonly'
    and quote_id in (select id from quotes where organization_id = current_organization_id())
  );
create policy "org members can delete own comments" on comments for delete
  using (
    current_user_role() != 'readonly'
    and quote_id in (select id from quotes where organization_id = current_organization_id())
  );

-- organizations blijft update-baar voor owner/admin alleen
drop policy if exists "org members can update own organization" on organizations;
create policy "owners and admins can update own organization" on organizations for update
  using (id = current_organization_id() and current_user_role() in ('owner', 'admin'));
