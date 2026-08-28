-- Fase 2: Supabase Storage-bucket voor offerte-foto's (cover, moodboard, pakketten).
-- Publiek leesbaar (nodig voor de klant-facing offertepagina zonder login, Fase 3),
-- maar alleen bureau-leden van de eigen organisatie mogen uploaden/verwijderen.
-- Bestandspad-conventie: <organization_id>/<...bestandsnaam>, zodat RLS op het
-- eerste pad-segment kan controleren.

insert into storage.buckets (id, name, public)
values ('quote-media', 'quote-media', true)
on conflict (id) do nothing;

create policy "Publiek leesbaar (quote-media)"
  on storage.objects for select
  using (bucket_id = 'quote-media');

create policy "Org members can upload quote-media"
  on storage.objects for insert
  with check (
    bucket_id = 'quote-media'
    and (storage.foldername(name))[1] = current_organization_id()::text
  );

create policy "Org members can update own quote-media"
  on storage.objects for update
  using (
    bucket_id = 'quote-media'
    and (storage.foldername(name))[1] = current_organization_id()::text
  );

create policy "Org members can delete own quote-media"
  on storage.objects for delete
  using (
    bucket_id = 'quote-media'
    and (storage.foldername(name))[1] = current_organization_id()::text
  );
