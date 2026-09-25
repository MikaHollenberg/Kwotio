-- Eigen, losse tekst voor de publieke offertepagina, naast de bestaande
-- "description" die ook in de offerte/PDF-inhoud van het arrangement zelf
-- gebruikt wordt. Leeg = de publieke pagina valt terug op "description"
-- (zie src/app/offertes/[slug]/data.ts), dus geen migratie van bestaande
-- teksten nodig.
alter table arrangements add column public_description text not null default '';
