-- Fase 4: digitaal ondertekenen + audit trail.
-- Handtekening-afbeeldingen en PDF-certificaten zijn gevoelig (persoonsgegevens
-- + juridisch bewijsstuk) en horen niet publiek leesbaar te zijn zoals
-- quote-media. Toegang loopt uitsluitend via de service-role client in
-- Server Actions/Route Handlers (zie src/app/offerte/[token]/certificaat/route.ts),
-- altijd gescoped op het share_token — nooit via directe Storage-URL's.

insert into storage.buckets (id, name, public)
values ('quote-documents', 'quote-documents', false)
on conflict (id) do nothing;

create policy "Org members can read own quote-documents"
  on storage.objects for select
  using (
    bucket_id = 'quote-documents'
    and (storage.foldername(name))[1] = current_organization_id()::text
  );

create policy "Org members can upload quote-documents"
  on storage.objects for insert
  with check (
    bucket_id = 'quote-documents'
    and (storage.foldername(name))[1] = current_organization_id()::text
  );

-- Wanneer een klant tekent, gebeurt dat via de service-role client (geen
-- ingelogde bureau-gebruiker) — die omzeilt RLS toch, dus er is geen aparte
-- anon-insertpolicy nodig voor deze bucket.
