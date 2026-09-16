-- Reden van afwijzen: de klant kon een offerte al afwijzen (declineQuote),
-- maar er werd nergens vastgelegd waarom. `decline_reason` is een vaste,
-- korte categorie (voor filterbare statistieken), `decline_note` een
-- optionele vrije toelichting -- beide nullable, alleen relevant zodra
-- status = 'geweigerd'.

alter table quotes add column decline_reason text;
alter table quotes add column decline_note text;
