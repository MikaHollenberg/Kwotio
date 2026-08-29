-- Feature: per "Pakketten & prijzen"-blok een eigen keuze i.p.v. één vaste
-- keuze voor de hele offerte. quotes.selected_package_id (een los tekstveld)
-- kan maar één keuze over de hele offerte vastleggen — bij meerdere
-- pakketten-blokken overschreven ze elkaar. Vervangen door selected_packages
-- (jsonb, { <quote_block_id>: <package_id> }).
--
-- Bestaande keuzes worden overgezet naar het EERSTE pakketten-blok van de
-- offerte (op volgorde van positie) zodat er geen data verloren gaat voor
-- reeds verzonden/getekende offertes met precies één pakketten-blok (de
-- enige situatie die tot nu toe correct kon werken). Als een offerte een
-- oude keuze heeft maar (inmiddels) geen pakketten-blok meer — bijv. het
-- blok is later verwijderd — is er niets zinvols om naartoe over te zetten;
-- dan blijft selected_packages gewoon leeg (coalesce vangt dit af, anders
-- knalt de not-null-constraint op deze weeskeuzes).
alter table quotes add column selected_packages jsonb not null default '{}'::jsonb;

update quotes q
set selected_packages = coalesce(
  (
    select jsonb_build_object(qb.id::text, q.selected_package_id)
    from quote_blocks qb
    where qb.quote_id = q.id and qb.type = 'packages'
    order by qb.position asc
    limit 1
  ),
  '{}'::jsonb
)
where q.selected_package_id is not null;

alter table quotes drop column selected_package_id;
