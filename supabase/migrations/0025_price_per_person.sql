-- Optionele prijsweergave "per persoon" i.p.v. totaal (punt 4). Puur een
-- label-wissel, geen rekensom: het aantal personen is pas bekend zodra de
-- klant tekent (feature 2), dus er kan tijdens het bekijken/kiezen van de
-- offerte niks door een aantal gedeeld worden. Het bureau vult in dat geval
-- zelf per-persoon-bedragen in als pakket-/optieprijzen.
alter table quotes add column price_per_person boolean not null default false;
