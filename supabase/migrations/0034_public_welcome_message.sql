-- Instelbare welkomsttekst bovenaan de publieke organisatiepagina
-- (/offertes/[slug]) — per organisatie vrij in te vullen, valt volledig weg
-- (geen sectie) zolang leeg, zelfde patroon als terms_url/aantal_personen_kanttekening.
alter table organizations add column public_welcome_message text;
