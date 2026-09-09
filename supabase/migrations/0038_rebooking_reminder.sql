-- Automatische "boek dit weer?"-herinnering rond de jaardatum van een
-- eerder geaccepteerd evenement -- hergebruikt, net als de review-aanvraag
-- (migratie 0037), de bestaande door het bureau zelf beheerde
-- email_automation_rules met een nieuw triggermoment.
-- Let op: een nieuwe enum-waarde kan niet in dezelfde transactie gebruikt
-- worden als waarin hij is toegevoegd -- dat gebeurt hier niet (alleen
-- toevoegen, niet gebruiken), dus veilig in een enkele migratie.

alter type email_trigger_type add value 'days_before_event_anniversary';
alter type activity_event_type add value 'rebooking_reminder_sent';
