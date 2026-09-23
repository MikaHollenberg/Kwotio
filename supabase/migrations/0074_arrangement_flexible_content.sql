-- Vervangt de vaste "inclusief-secties + één actievak + extra's"-opzet uit
-- migratie 0072 door één vrij samen te stellen content_items-lijst (tekst,
-- categorie, extra's, afbeelding, actievak -- elk met eigen breedte 1-4,
-- kleur en icoon), plus een los te uploaden PDF per arrangement. Er staat
-- nog geen live data in deze kolommen (feature nog niet gelanceerd), dus
-- een schone vervanging i.p.v. een data-migratie.
alter table arrangements
  drop column inclusief_sections,
  drop column highlight_title,
  drop column highlight_text,
  drop column extras,
  add column content_items jsonb not null default '[]'::jsonb,
  add column pdf_url text;
