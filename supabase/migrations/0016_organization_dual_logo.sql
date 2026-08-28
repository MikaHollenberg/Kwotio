-- Organisaties krijgen twee losse logo-uploads (horizontaal + vierkant)
-- i.p.v. één enkel logo_url, plus een voorkeur welke van de twee gebruikt
-- wordt op plekken met één enkel logo (publieke offertepagina, PDF,
-- instellingen-voorbeeld). De menubalk linksboven in het dashboard gebruikt
-- altijd het horizontale logo, ongeacht deze voorkeur (bewuste keuze,
-- besproken met de gebruiker) — geregeld in de applicatiecode, niet hier.

create type logo_preference as enum ('horizontaal', 'vierkant');

alter table organizations
  add column logo_horizontal_url text,
  add column logo_square_url text,
  add column logo_preference logo_preference not null default 'horizontaal';

-- Bestaande logo_url overzetten naar het horizontale slot (zo werd het tot nu
-- toe overal getoond: public-quote-view.tsx en de PDF gebruikten variant
-- "horizontaal").
update organizations set logo_horizontal_url = logo_url where logo_url is not null;

-- Caribbean Bar Uitgeest had zelf nog geen eigen logo_url ingesteld (gebruikte
-- overal het gebundelde standaard-logo uit de app zelf) — die twee bestaande
-- gebundelde assets worden hier expliciet als hun logo_horizontal_url/
-- logo_square_url gezet, zodat hun eigen weergave (menubalk, offertepagina,
-- PDF) exact hetzelfde blijft ogen nu de fallback voor iedereen zonder eigen
-- logo naar het Offerio-platformlogo verandert.
update organizations
set logo_horizontal_url = coalesce(logo_horizontal_url, '/brand/logo-horizontaal.png'),
    logo_square_url = coalesce(logo_square_url, '/brand/logo-vierkant.png')
where brand_name = 'Caribbean Bar Uitgeest';

alter table organizations drop column logo_url;
