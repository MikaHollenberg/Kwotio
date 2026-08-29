-- Blok-templates: herbruikbare content per los bloktype (bv. een vaste
-- intro-tekst, of een "Pakketten & prijzen"-blok met prijzen die al goed
-- staan), los van een hele-offerte-template. Zelfde opslagpatroon als
-- template_blocks: content blijft 1:1 jsonb (géén normalisatie van
-- packages/addons zoals bij quote_blocks — dat gebeurt pas op het moment dat
-- de blok-template op een offerte wordt toegepast, via de bestaande
-- saveQuoteBlocks-route die deze normalisatie al afhandelt).

create table block_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  type block_type not null,
  name text not null,
  content jsonb not null default '{}'::jsonb,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger block_templates_set_updated_at before update on block_templates
  for each row execute function set_updated_at();
create index block_templates_organization_id_idx on block_templates(organization_id);

alter table block_templates enable row level security;

create policy "org members can read own block_templates" on block_templates for select
  using (organization_id = current_organization_id());
create policy "org members can write own block_templates" on block_templates for insert
  with check (organization_id = current_organization_id() and current_user_role() != 'readonly');
create policy "org members can update own block_templates" on block_templates for update
  using (organization_id = current_organization_id() and current_user_role() != 'readonly');
create policy "org members can delete own block_templates" on block_templates for delete
  using (organization_id = current_organization_id() and current_user_role() != 'readonly');
