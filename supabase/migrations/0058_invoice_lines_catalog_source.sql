-- Fase 6-vervolg: eigen, duidelijk benoemd informatief veld voor "deze
-- factuurregel kwam uit dit factuurartikel" -- i.p.v. het semantisch andere
-- `source_package_id` (dat is voor offerte-pakketten) te hergebruiken.
-- Bewust geen foreign key, zelfde redenering als source_package_id/
-- source_addon_id: een later verwijderd/bewerkt artikel mag de factuurregel
-- niet breken.
alter table invoice_lines add column source_catalog_item_id uuid;
