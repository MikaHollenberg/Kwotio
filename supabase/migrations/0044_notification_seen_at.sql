-- Meldingenbel: welke reacties/afwijzingen/ondertekeningen/aanvragen heeft
-- dit teamlid al gezien? Net als `onboarding_tour_seen_at` een simpel
-- watermerk-tijdstempel i.p.v. een aparte "gelezen"-rij per melding -- alles
-- van ná dit tijdstip is "ongelezen". Default `now()` (i.p.v. null) zodat
-- bestaande accounts niet in één keer overspoeld worden met maanden aan
-- geschiedenis als "ongelezen" zodra deze kolom er komt.

alter table profiles add column notifications_seen_at timestamptz not null default now();
