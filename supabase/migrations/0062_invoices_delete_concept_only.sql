-- Sta verwijderen van een factuur toe, maar UITSLUITEND zolang die nog
-- 'concept' is (nooit verstuurd/betaald) -- een verstuurde/betaalde factuur
-- heeft een wettelijk vereist doorlopend factuurnummer; die verwijderen zou
-- een gat in de nummerreeks veroorzaken. Bewuste, aan de gebruiker
-- voorgelegde keuze (zie Fase 13/vervolgsessie), strenger dan hoe offertes
-- verwijderd kunnen worden ongeacht status. `invoice_lines` cascadet al
-- (on delete cascade, zie migratie 0049) en heeft al een eigen
-- owner/admin-delete-policy (migratie 0060) die niet op status filtert --
-- dat is prima, want zonder deze policy hierbeneden kan er sowieso nooit
-- bij een niet-concept factuur worden gekomen.

create policy "owner/admin can delete concept invoices" on invoices
  for delete
  using (
    organization_id = current_organization_id()
    and current_user_role() in ('owner', 'admin')
    and status = 'concept'
  );
