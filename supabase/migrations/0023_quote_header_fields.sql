-- Kop-sectie op de offerte (organisatiegegevens + klantgegevens, altijd
-- automatisch aanwezig, geen los toe te voegen blok):
--
-- - handled_by_profile_id: gekoppeld teamlid ("wie behandelt dit"), default
--   de aanmaker van de offerte, later aan te passen naar elk teamlid van de
--   eigen organisatie.
-- - client_display_*: klantgegevens zoals getoond op DEZE offerte. Worden
--   bij het aanmaken/koppelen van een klant automatisch gevuld vanuit het
--   klantrecord (clients-tabel), maar zijn daarna per offerte los aan te
--   passen zonder het onderliggende klantrecord te wijzigen.
-- - reference_number: inkooporder/referentienummer, begint altijd leeg,
--   nergens automatisch uit overgenomen.
alter table quotes
  add column handled_by_profile_id uuid references profiles(id) on delete set null,
  add column client_display_name text,
  add column client_display_email text,
  add column client_display_phone text,
  add column client_display_company text,
  add column reference_number text;
