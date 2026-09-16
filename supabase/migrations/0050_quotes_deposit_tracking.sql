-- Fase 6: leesgeoptimaliseerde "aanbetaald"-cache op de offerte zelf, zodat
-- de offertes-lijst/-detailpagina dit niet bij elke render tegen `invoices`
-- hoeft te joinen -- zelfde soort denormalisatie als de bestaande
-- `decline_reason`/`internal_notes`. De factuurrij blijft de bron van
-- waarheid voor bedragen; deze kolommen worden precies één keer bijgewerkt
-- (zodra de aanbetalingsfactuur op betaald gaat, handmatig of via Mollie).
alter table quotes
  add column deposit_invoice_id uuid references invoices(id) on delete set null,
  add column deposit_amount numeric(10,2), -- incl. btw
  add column deposit_paid_at timestamptz;
