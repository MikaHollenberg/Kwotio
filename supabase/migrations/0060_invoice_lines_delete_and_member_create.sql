-- Twee losse fixes voor de factuurmodule:
--
-- 1) BUG: invoice_lines had nooit een delete-policy. updateInvoiceLines()
--    (het opslaan van bewerkte regels op een conceptfactuur) voegt de nieuwe
--    regels toe en verwijdert daarna de oude -- die delete werd door RLS
--    stil geweigerd (0 rijen, geen foutmelding), dus de oude regel bleef
--    gewoon staan. Elke keer opslaan voegde zo een duplicaat toe i.p.v. te
--    vervangen. Mirrort exact de bestaande "owner/admin can update invoice
--    lines"-policy (zelfde rechten als bewerken, want opslaan = intern een
--    vervang-actie).
--
-- 2) Rollenscheiding: een teamlid (member) mag voortaan facturen AANMAKEN
--    (net als offertes/klanten), maar niet bewerken/versturen/betalingen
--    registreren -- dat blijft owner/admin, net als voorheen. Alleen-lezen
--    kon en kan nog steeds alleen lezen (de select-policy was al
--    rol-onafhankelijk org-scoped, daar hoeft niets aan te veranderen).

drop policy if exists "owner/admin can insert invoices" on invoices;
create policy "owner/admin/member can insert invoices" on invoices
  for insert
  with check (
    organization_id = current_organization_id()
    and current_user_role() in ('owner', 'admin', 'member')
  );

drop policy if exists "owner/admin can insert invoice lines" on invoice_lines;
create policy "owner/admin/member can insert invoice lines" on invoice_lines
  for insert
  with check (
    current_user_role() in ('owner', 'admin', 'member')
    and invoice_id in (select id from invoices where organization_id = current_organization_id())
  );

create policy "owner/admin can delete invoice lines" on invoice_lines
  for delete
  using (
    current_user_role() in ('owner', 'admin')
    and invoice_id in (select id from invoices where organization_id = current_organization_id())
  );
