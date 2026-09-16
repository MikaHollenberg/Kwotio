-- Interne notitie per offerte -- alleen voor het team, nooit zichtbaar voor
-- de klant (in tegenstelling tot `comments`, die de klant wel kan lezen).
-- Simpel los tekstveld, zelfde soort keuze als `clients.notes`.

alter table quotes add column internal_notes text;
