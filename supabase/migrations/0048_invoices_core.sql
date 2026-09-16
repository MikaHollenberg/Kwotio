-- Fase 6: kern van de factuurmodule -- de `invoices`-tabel zelf, plus de
-- atomaire nummergenerator. Regels/producten staan in de losse
-- `invoice_lines`-tabel (0049), zodat een toekomstige UBL/Peppol-export
-- (pas wettelijk verplicht vanaf 2030) later zonder herbouw kan.

create type invoice_status as enum (
  'concept', 'open', 'deels_betaald', 'betaald', 'vervallen', 'geannuleerd'
);
create type invoice_type as enum ('standaard', 'aanbetaling', 'slotfactuur');
create type invoice_payment_method as enum ('mollie', 'handmatig');

create table invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  quote_id uuid not null references quotes(id) on delete restrict,
  -- Een slotfactuur verwijst terug naar de aanbetalingsfactuur die hij
  -- verrekent; null voor 'standaard' en 'aanbetaling'.
  deposit_invoice_id uuid references invoices(id) on delete restrict,

  type invoice_type not null default 'standaard',
  status invoice_status not null default 'concept',

  -- Doorlopend, jaarlijks resettend nummer per organisatie (bv. "CB2026-0001")
  -- -- zie next_invoice_number() hieronder. Onveranderlijk na aanmaken.
  invoice_number text not null,
  invoice_year integer not null,
  invoice_date date not null default current_date,
  due_date date not null,
  delivery_date date, -- alleen tonen op de PDF als deze afwijkt van invoice_date

  -- Gesnapshotte, wettelijk verplichte partijgegevens -- een factuur is een
  -- onveranderlijk juridisch document en leest daarom NOOIT live uit
  -- `organizations`/`clients`, in tegenstelling tot de offerte-PDF die wel
  -- live rendert (zie app/src/lib/quote-pdf/quote-document.tsx).
  org_name text not null,
  org_address jsonb not null default '{}'::jsonb,
  org_btw_number text,
  org_kvk_number text,
  org_iban text,
  client_name text not null,
  client_company text,
  client_address jsonb,
  client_email text,

  subtotal_excl_vat numeric(10,2) not null,
  vat_amount numeric(10,2) not null,
  total_incl_vat numeric(10,2) not null,

  -- Aanbetaling-boekhouding (alleen relevant bij type = 'aanbetaling').
  deposit_basis_percentage numeric(5,2),
  deposit_basis_amount numeric(10,2), -- de volledige orderwaarde incl. btw waar dit % van is

  payment_method invoice_payment_method,
  paid_at timestamptz,
  paid_note text, -- notitie bij handmatig "markeer als betaald"
  mollie_payment_id text,
  mollie_payment_status text, -- laatst bekende ruwe Mollie-statustekst, t.b.v. support/debug

  reminder_sent_at timestamptz,

  sent_at timestamptz,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint invoices_org_number_year_unique unique (organization_id, invoice_year, invoice_number)
);
create trigger invoices_set_updated_at before update on invoices
  for each row execute function set_updated_at();

create index invoices_organization_id_idx on invoices(organization_id);
create index invoices_quote_id_idx on invoices(quote_id);
create index invoices_status_idx on invoices(organization_id, status);
create index invoices_deposit_invoice_id_idx on invoices(deposit_invoice_id) where deposit_invoice_id is not null;
create unique index invoices_mollie_payment_id_idx on invoices(mollie_payment_id) where mollie_payment_id is not null;

alter table invoices enable row level security;

create policy "org members can read own invoices" on invoices for select
  using (organization_id = current_organization_id());
-- Geld-schrijvende acties: strenger dan het gebruikelijke "!= 'readonly'"-
-- patroon van offertes/klanten -- alleen owner/admin, zelfde lijn als
-- Instellingen/Statistieken.
create policy "owner/admin can insert invoices" on invoices for insert
  with check (
    organization_id = current_organization_id()
    and current_user_role() in ('owner', 'admin')
  );
create policy "owner/admin can update invoices" on invoices for update
  using (organization_id = current_organization_id() and current_user_role() in ('owner', 'admin'));
-- Bewust GEEN delete-policy: facturen zijn juridische documenten en worden
-- nooit hard verwijderd. Status 'geannuleerd' is de "ik heb een fout
-- gemaakt"-uitweg.

-- ---------------------------------------------------------------------------
-- next_invoice_number -- atomaire, jaarlijks resettende nummergenerator.
-- Eén enkele functieaanroep (select ... for update, dan update) zodat twee
-- gelijktijdige aanroepen (twee tabbladen/teamleden) nooit hetzelfde nummer
-- kunnen krijgen -- de rijlock van "for update" serialiseert ze vanzelf. De
-- unieke constraint hierboven is een tweede, goedkope vangnet.
-- ---------------------------------------------------------------------------
create or replace function next_invoice_number(p_organization_id uuid)
returns table (invoice_number text, invoice_year integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_year integer := extract(year from now())::integer;
  v_prefix text;
  v_reset_year integer;
  v_next integer;
begin
  select o.invoice_number_prefix, o.invoice_number_reset_year, o.next_invoice_number
    into v_prefix, v_reset_year, v_next
    from organizations o
    where o.id = p_organization_id
    for update;

  if not found then
    raise exception 'Organisatie % niet gevonden', p_organization_id;
  end if;

  if v_reset_year is distinct from v_current_year then
    v_next := 1;
  end if;

  update organizations
    set next_invoice_number = v_next + 1,
        invoice_number_reset_year = v_current_year
    where id = p_organization_id;

  return query select
    coalesce(v_prefix, '') || v_current_year::text || '-' || lpad(v_next::text, 4, '0'),
    v_current_year;
end;
$$;
