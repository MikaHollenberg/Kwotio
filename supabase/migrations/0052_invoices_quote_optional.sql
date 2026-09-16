-- Fase 6-vervolg: losse facturen zonder onderliggende offerte ("vanaf 0
-- beginnen"). Bestaande offerte-gebonden facturen (quote_id ingevuld)
-- blijven ongewijzigd werken -- deze kolom wordt alleen niet meer verplicht.
alter table invoices alter column quote_id drop not null;
