-- Nieuw offerte-bloktype "arrangement" -- een bureau voegt een arrangement uit
-- de catalogus toe aan een offerte; de volledige inhoud wordt op dat moment
-- als momentopname gekopieerd naar het blok (zelfde principe als
-- blok-templates), geen live koppeling. Losse migratie: ALTER TYPE ... ADD
-- VALUE moet buiten dezelfde transactie staan als code die de nieuwe waarde
-- gebruikt.
alter type block_type add value 'arrangement';
