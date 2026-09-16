-- Vaste, wekelijks terugkerende gesloten dag(en) (bv. "wij zijn altijd op
-- maandag dicht") -- los van de specifieke datums in `closed_dates`, want
-- dit is geen los record per datum maar een klein, statisch instelling-veld
-- op de organisatie zelf (zelfde soort keuze als `brand_theme`). Waarden:
-- 0 = zondag .. 6 = zaterdag, zodat de kolom direct vergelijkbaar is met
-- JavaScript's `Date.getDay()` in de front-end (geen vertaalslag nodig).

alter table organizations add column closed_weekdays smallint[] not null default '{}';
