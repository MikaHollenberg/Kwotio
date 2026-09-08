-- Ontbrekende delete-policy voor quote_requests (migratie 0032 had alleen
-- select/update) — nodig zodat een organisatiebeheerder een aanvraag
-- (bijv. spam of een duidelijke fout) definitief kan verwijderen.
create policy "org members can delete own quote_requests" on quote_requests for delete
  using (organization_id = current_organization_id() and current_user_role() != 'readonly');
