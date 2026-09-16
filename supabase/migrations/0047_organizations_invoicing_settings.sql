-- Fase 6: instellingen op organisatieniveau voor de nieuwe factuurmodule.
-- Alle kolommen zijn nullable of hebben een default die het huidige gedrag
-- niet verandert -- puur voorbereidend, de module zelf is pas actief zodra
-- iemand daadwerkelijk een factuur aanmaakt (zie 0048).
--
-- `invoice_default_vat_rate` is een NIEUWE, losse btw-instelling specifiek
-- voor facturen -- niet hetzelfde als het oude `organizations.default_vat_rate`
-- dat in migratie 0004 bewust verwijderd is (offertes tonen sindsdien alleen
-- een incl./excl.-label, geen rekensom). Een factuur is wettelijk een ander
-- soort document: btw-tarief en -bedrag moeten er expliciet op staan, dus die
-- rekenlogica hoort hier terug, losstaand van de offerte-kant.
alter table organizations
  add column invoice_number_prefix text,
  add column next_invoice_number integer not null default 1,
  add column invoice_number_reset_year integer,
  add column invoice_default_vat_rate numeric(5,2) not null default 21.00,
  add column invoice_due_days integer not null default 14,
  add column invoice_auto_send boolean not null default false,
  add column invoice_reminder_enabled boolean not null default true,
  -- Mollie-koppeling: elke organisatie plakt haar eigen API-sleutel hier in
  -- (geen OAuth/Connect-flow, zie HANDOVER/plan-document). Nooit selecteren
  -- vanuit een niet-admin client-component -- alleen server-only code (het
  -- aanmaken van een betaallink, de webhook) leest deze kolom rechtstreeks.
  -- De Instellingen-UI toont alleen een gemaskeerde waarde.
  add column mollie_api_key text;
