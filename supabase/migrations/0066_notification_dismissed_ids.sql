-- Meldingenbel: welke meldingen heeft dit teamlid zelf weggeklikt of
-- "alles wissen" gedaan? Net als notifications_seen_at (migratie 0044) geen
-- aparte notifications-tabel -- meldingen blijven afgeleid uit bestaande
-- data (comments/activity_events/quote_requests), dus "verwijderen" kan geen
-- rij weghalen. In plaats daarvan onthouden we welke afgeleide id's
-- (bijv. "comment-<uuid>") niet meer getoond moeten worden. Default lege
-- array zodat bestaande accounts niets kwijtraken.

alter table profiles add column dismissed_notification_ids text[] not null default '{}';
