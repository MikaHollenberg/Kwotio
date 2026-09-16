-- Beveiligingsfix, gevonden via de Supabase security-advisor direct na het
-- draaien van 0047-0050: next_invoice_number() had geen eigen
-- autorisatie-check. Als SECURITY DEFINER-functie omzeilt hij RLS, dus
-- zonder deze check kon in theorie een willekeurige ingelogde (of zelfs
-- anonieme) aanroeper het factuurnummer van een ANDERE organisatie laten
-- oplopen via een directe RPC-aanroep (/rest/v1/rpc/next_invoice_number)
-- met een geraden organization_id -- geen datalek, maar wel ongewenste
-- gaten in andermans doorlopende nummerreeks. Nu dezelfde eis als de
-- insert-policy op `invoices`: alleen de eigen, ingelogde owner/admin.
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
  if current_organization_id() is distinct from p_organization_id
     or current_user_role() not in ('owner', 'admin') then
    raise exception 'Niet toegestaan.';
  end if;

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

revoke execute on function next_invoice_number(uuid) from anon;
