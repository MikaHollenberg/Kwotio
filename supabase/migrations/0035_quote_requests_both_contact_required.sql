-- Zowel e-mail als telefoon nu verplicht bij een offerte-aanvraag (eerder:
-- minstens één van beide) — op verzoek van de gebruiker na het eerste
-- testen van het formulier.
alter table quote_requests drop constraint quote_requests_contact_required;
alter table quote_requests alter column customer_email set not null;
alter table quote_requests alter column customer_phone set not null;
