-- Creditnota's: de oplossing voor een foutieve, al verstuurde/betaalde
-- factuur (die mag nooit verwijderd/aangepast worden, zie migratie 0062).
-- Een creditnota is een aparte factuur met omgekeerde (negatieve) bedragen
-- die naar de originele factuur verwijst en 'm in de boekhouding
-- neutraliseert -- krijgt gewoon een eigen nummer uit dezelfde doorlopende
-- reeks (geen apart telwerk nodig).

alter type invoice_type add value 'creditnota';

alter table invoices
  add column credit_for_invoice_id uuid references invoices(id);
