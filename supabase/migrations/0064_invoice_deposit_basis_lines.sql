-- Bewaart de onderliggende regels waarmee een PERCENTAGE-aanbetaling
-- berekend is (offerte-pakketten, of zelf ingevulde regels bij een losse
-- factuur) -- zodat de slotfactuur-pagina daar straks mee voorgevuld kan
-- worden i.p.v. helemaal leeg te beginnen. Blijft NULL bij een vast bedrag
-- (die staat bewust los van elk regel-aantal, zie migratie 0060-0063's
-- sessie) -- de slotfactuur begint dan nog steeds vanaf 0.

alter table invoices
  add column deposit_basis_lines jsonb;
