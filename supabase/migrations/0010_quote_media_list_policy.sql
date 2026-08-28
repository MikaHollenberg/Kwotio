-- Fase 4 beveiligingsplan: de leesbeleid voor quote-media stond open voor
-- lijst-/select-operaties (storage.objects) zonder enige scoping, waardoor
-- alle geuploade bestanden -- van elke organisatie -- opgesomd konden worden
-- via de Storage list-API. Dit raakt NIET de normale weergave van foto's op
-- de publieke offertepagina: een publieke bucket (quote-media is public =
-- true) serveert exacte object-URL's altijd buiten RLS om, ongeacht deze
-- policy -- alleen list()/select() via de API wordt hierdoor beperkt.

drop policy if exists "Publiek leesbaar (quote-media)" on storage.objects;

create policy "Org members can list own quote-media" on storage.objects for select
  using (bucket_id = 'quote-media' and (storage.foldername(name))[1] = current_organization_id()::text);
