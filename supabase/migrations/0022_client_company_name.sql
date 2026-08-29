-- Optionele bedrijfsnaam bij een klant (het bedrijf dat de offerte aanvraagt,
-- los van de contactpersoon zelf). Blijft nullable: e-mail is voortaan
-- verplicht bij het aanmaken van een NIEUWE klant (afgedwongen in de
-- applicatiecode, niet hier), maar dat geldt niet met terugwerkende kracht
-- voor bestaande klanten zonder e-mailadres.
alter table clients
  add column company_name text;
