-- Fase 6-vervolg: doorlopend klantnummer per organisatie (zichtbaar op
-- facturen, zelfde soort mechaniek als de factuurnummering) -- maar zonder
-- jaarlijkse reset, een klantnummer moet stabiel blijven zolang de klant
-- bestaat.
--
-- Bewust een BEFORE INSERT-trigger i.p.v. een los aan te roepen RPC-functie:
-- klanten worden op meerdere plekken in de app aangemaakt (klanten-pagina,
-- snel-toevoegen bij een nieuwe offerte, het omzetten van een aanvraag) --
-- een trigger kent maar één plek nodig te hebben i.p.v. elk van die
-- aanroepen apart te moeten aanpassen, en werkt dus ook meteen voor nieuwe
-- aanmaakplekken in de toekomst.
alter table organizations add column next_client_number integer not null default 1;
alter table clients add column client_number integer;

create or replace function assign_client_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_next integer;
begin
  if new.client_number is not null then
    return new;
  end if;

  update organizations
    set next_client_number = next_client_number + 1
    where id = new.organization_id
    returning next_client_number - 1 into v_next;

  new.client_number := v_next;
  return new;
end;
$$;

create trigger clients_assign_number before insert on clients
  for each row execute function assign_client_number();

-- Bestaande klanten krijgen met terugwerkende kracht een nummer (op
-- volgorde van aanmaakdatum, per organisatie), zodat niemand zonder nummer
-- achterblijft.
do $$
declare
  org record;
  client_row record;
  counter integer;
begin
  for org in select id from organizations loop
    counter := 1;
    for client_row in select id from clients where organization_id = org.id order by created_at asc loop
      update clients set client_number = counter where id = client_row.id;
      counter := counter + 1;
    end loop;
    update organizations set next_client_number = counter where id = org.id;
  end loop;
end $$;

alter table clients add constraint clients_org_client_number_unique unique (organization_id, client_number);
