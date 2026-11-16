-- Per pakket en per optie vastleggen of de prijs per persoon ('p.p.') of een
-- totaalbedrag ('vast') is. Nullable: null = volgt nog de oude, offerte-brede
-- "Totaal / Per persoon"-instelling (quotes.price_per_person), zodat bestaande
-- offertes er exact hetzelfde uitzien tot het bureau zelf een keuze maakt.
alter table quote_packages
  add column if not exists price_unit text check (price_unit in ('vast', 'p.p.'));
alter table quote_addons
  add column if not exists price_unit text check (price_unit in ('vast', 'p.p.'));
