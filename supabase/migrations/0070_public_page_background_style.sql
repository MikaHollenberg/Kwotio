-- Vervangt de simpele aan/uit-kustlijn-toggle door een keuze tussen
-- meerdere achtergrondstijlen (uitbreidbaar voor toekomstige stijlen).
alter table organizations
  add column public_page_background_style text not null default 'none'
    check (public_page_background_style in ('none', 'coastline', 'icons'));

update organizations
  set public_page_background_style = 'coastline'
  where public_page_coastline_background = true;

alter table organizations
  drop column public_page_coastline_background;
