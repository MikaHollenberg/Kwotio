-- Aanpasbare e-mailteksten (herinnering + nieuwe evenement-herinnering) en
-- het nieuwe activity_event-type voor de dedupe-check van die laatste.
-- Let op: een nieuwe enum-waarde kan niet in dezelfde transactie gebruikt
-- worden als waarin hij is toegevoegd -- dat gebeurt hier niet (alleen
-- toevoegen, niet gebruiken), dus veilig in één migratie.

alter type activity_event_type add value 'event_reminder_sent';

alter table organizations
  add column reminder_email_subject text,
  add column reminder_email_body text,
  add column event_reminder_email_subject text,
  add column event_reminder_email_body text;
