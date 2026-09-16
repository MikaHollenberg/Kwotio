-- Fase 6-vervolg: tot 3 logo's op de factuurkop (hoofdlogo + max. 2 extra --
-- bv. voor een zusterbedrijf/afdeling). Het hoofdlogo blijft gewoon
-- `logo_horizontal_url`/`logo_square_url` (resolvePreferredLogo()); dit zijn
-- uitsluitend de 0-2 extra's.
alter table organizations
  add column invoice_extra_logo_urls text[] not null default '{}',
  add constraint invoice_extra_logo_urls_max_two check (array_length(invoice_extra_logo_urls, 1) is null or array_length(invoice_extra_logo_urls, 1) <= 2);
