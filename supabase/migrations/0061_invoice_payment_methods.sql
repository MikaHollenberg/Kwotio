-- Vervangt het generieke "handmatig" door specifieke betaalmethodes bij
-- "Markeer als betaald": overboeken/pin/contant/sponsoring/overig. `mollie`
-- blijft ongewijzigd (wordt alleen door de Mollie-webhook gezet, niet
-- handmatig gekozen). Geen enkele factuur heeft op dit moment een
-- `payment_method` gezet (0 rijen), dus geen dataverlies -- de `case`
-- hieronder is puur een veiligheidsnet mocht dat tussen schrijven en
-- uitvoeren van deze migratie toch zijn gebeurd.

create type invoice_payment_method_new as enum ('mollie', 'overboeking', 'pin', 'contant', 'sponsoring', 'overig');

alter table invoices
  alter column payment_method type invoice_payment_method_new
  using (
    case payment_method::text
      when 'mollie' then 'mollie'
      when 'handmatig' then 'overboeking'
      else null
    end
  )::invoice_payment_method_new;

drop type invoice_payment_method;
alter type invoice_payment_method_new rename to invoice_payment_method;
