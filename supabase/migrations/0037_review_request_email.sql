-- Automatische review-aanvraag e-mail X dagen na een geslaagd evenement.
-- Hergebruikt de bestaande, door het bureau zelf beheerde
-- email_automation_rules (Instellingen -> E-mailautomatisering) met een
-- nieuw triggermoment, geen nieuwe tabel nodig.
-- Let op: een nieuwe enum-waarde kan niet in dezelfde transactie gebruikt
-- worden als waarin hij is toegevoegd -- dat gebeurt hier niet (alleen
-- toevoegen, niet gebruiken), dus veilig in een enkele migratie.

alter type email_trigger_type add value 'days_after_event';
alter type activity_event_type add value 'review_request_sent';

alter table organizations
  add column review_url text;
