-- Optionele "aantal personen"-invoer bij ondertekenen (feature 2). Per
-- organisatie in/uit te schakelen (standaard uit) in de instellingen, met
-- een zelf in te stellen kanttekening-tekst die naast het invulveld komt te
-- staan. Of de optie voor een SPECIFIEKE offerte actief is, en het
-- uiteindelijk ingevulde aantal, wordt apart op de quotes-tabel bijgehouden
-- (zie een volgende migratie).
alter table organizations
  add column aantal_personen_actief boolean not null default false,
  add column aantal_personen_kanttekening text;
