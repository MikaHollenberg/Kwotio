-- Nieuwe activity_events-waarde voor het moment dat een klant een offerte
-- expliciet afwijst (punt 6) — apart van "option_changed" (pakket-/optie-
-- keuzes), zodat dit als eigen, herkenbare gebeurtenis in de activiteiten-
-- geschiedenis terug te vinden is.
alter type activity_event_type add value 'declined';
