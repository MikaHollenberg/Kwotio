-- Fase 6-vervolg: hoog/laag-btw, zelf aanpasbaar per organisatie (SnelStart-
-- achtig: elke factuurregel kiest simpelweg Hoog/Laag/0%/Aangepast i.p.v.
-- een los percentage te onthouden). Hernoemt de bestaande
-- `invoice_default_vat_rate` (nooit UI-instelbaar geweest, altijd 21.00)
-- naar `invoice_vat_rate_high` -- zelfde kolom/waarde, alleen een duidelijkere
-- naam nu er een tweede tarief bij komt. Geen gedragswijziging voor bestaande
-- organisaties.
alter table organizations rename column invoice_default_vat_rate to invoice_vat_rate_high;
alter table organizations add column invoice_vat_rate_low numeric(5,2) not null default 9.00;
