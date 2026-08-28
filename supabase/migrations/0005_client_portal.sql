-- Fase 3: klantportaal — de klant selecteert een pakket + opties zonder in te
-- loggen; die keuze wordt bewaard zodat 'ie blijft staan bij een volgend
-- bezoek en straks (Fase 4) de basis vormt voor wat er getekend wordt.
--
-- Publieke toegang loopt niet via anon-RLS-policies, maar via Next.js Server
-- Actions die de service-role client gebruiken (zie src/lib/supabase/admin.ts)
-- en altijd eerst de quote via zijn share_token opzoeken voordat er iets
-- gelezen/geschreven wordt — het token is de enige "sleutel".

alter table quotes
  add column selected_package_id uuid references quote_packages(id) on delete set null,
  add column selected_addons jsonb not null default '{}'::jsonb;
