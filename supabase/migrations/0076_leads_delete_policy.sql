-- Ontbrekende delete-policy voor leads (migratie 0075 had alleen
-- select/update) -- nodig zodat een organisatiebeheerder een duidelijk
-- foutieve/spam-lead kan verwijderen, en voor de FAQ-rondleiding om haar
-- eigen tijdelijke voorbeeldlead weer op te ruimen (zelfde reden als
-- migratie 0033 voor quote_requests).
create policy "org members can delete leads" on leads for delete
  using (organization_id = current_organization_id() and current_user_role() != 'readonly');
