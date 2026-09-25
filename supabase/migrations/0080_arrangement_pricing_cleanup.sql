-- Opruiming na 0079: de oude staffel/seizoen-tabellen en de oude
-- basisprijs/prijsmodel-kolommen op arrangements zijn sinds 0079 niet meer
-- in gebruik (vervangen door arrangement_prices/arrangement_seasons/
-- arrangement_surcharges). Alle code is al overgezet; dit is puur opruiming.
--
-- Destructief -- door de gebruiker zelf te draaien in de Supabase SQL-editor
-- (de Claude Code auto-mode-classifier weigert DROP-statements van deze
-- omvang zelf uit te voeren).

drop table arrangement_price_tiers;
drop table arrangement_season_prices;

alter table arrangements drop column base_price;
alter table arrangements drop column pricing_mode;
alter table arrangements drop column price_per_person;

drop type arrangement_pricing_mode;
