-- Follow-up-herinnering: een zelf te zetten datum per lead/offerte die
-- daadwerkelijk in de meldingenbel verschijnt zodra die datum is aangebroken
-- -- los van de bestaande contactmomenten-log (quote_contact_logs), die
-- alleen registreert wat al gebeurd is, niet vooruit herinnert.
alter table leads add column reminder_date date;
alter table quotes add column reminder_date date;
