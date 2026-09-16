-- Fase 6-vervolg: optionele koppeling naar een bestaand CRM-klantrecord bij
-- een losse factuur (zonder offerte). Blijft leeg als de factuur op een
-- vrij ingetypte, eenmalige klant staat -- de al bestaande
-- client_name/_company/_email/_address-snapshotvelden op `invoices` blijven
-- in beide gevallen de bron van waarheid voor wat er op de factuur/PDF komt.
alter table invoices add column client_id uuid references clients(id) on delete set null;
create index invoices_client_id_idx on invoices(client_id) where client_id is not null;
