-- Fase 6: factuurregels, los van `invoices.total_incl_vat` e.d. opgeslagen in
-- eigen numerieke kolommen (niet een jsonb-blob, niet alleen PDF-tekst) --
-- precies wat een latere UBL/Peppol-export zonder herbouw mogelijk maakt.

create table invoice_lines (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  description text not null,
  quantity numeric(10,2) not null default 1,
  unit_price numeric(10,2) not null, -- excl. btw
  vat_rate numeric(5,2) not null,
  vat_amount numeric(10,2) not null, -- gesnapshot, niet herberekend bij het lezen
  line_total numeric(10,2) not null, -- incl. btw
  sort_order integer not null default 0,
  -- Informatief, bewust geen foreign key: de bron-pakketten/opties van een
  -- offerte kunnen later bewerkt/verwijderd worden, een factuur moet dat
  -- overleven zonder een kapotte referentie.
  source_package_id uuid,
  source_addon_id uuid,
  created_at timestamptz not null default now()
);
create index invoice_lines_invoice_id_idx on invoice_lines(invoice_id);

alter table invoice_lines enable row level security;

create policy "org members can read own invoice lines" on invoice_lines for select
  using (invoice_id in (select id from invoices where organization_id = current_organization_id()));
create policy "owner/admin can insert invoice lines" on invoice_lines for insert
  with check (
    current_user_role() in ('owner', 'admin')
    and invoice_id in (select id from invoices where organization_id = current_organization_id())
  );
create policy "owner/admin can update invoice lines" on invoice_lines for update
  using (
    current_user_role() in ('owner', 'admin')
    and invoice_id in (select id from invoices where organization_id = current_organization_id())
  );
-- Geen delete-policy, zelfde onveranderlijkheidsredenering als `invoices`.
