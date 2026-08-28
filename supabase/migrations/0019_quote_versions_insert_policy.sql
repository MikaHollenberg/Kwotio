-- Bugfix: quote_versions had sinds de allereerste migratie (0001) alleen een
-- leesbeleid ("org members can read own quote_versions"), nooit een
-- schrijfbeleid. Elke keer dat een bureau-gebruiker op "Versturen" klikt
-- (sendQuote in app/src/app/dashboard/offertes/actions.ts) probeert de app
-- via de gewone, RLS-gebonden client een snapshot-rij in te voegen — zonder
-- insert-policy werd dat altijd geblokkeerd door Postgres met
-- "new row violates row-level security policy for table \"quote_versions\""
-- (42501). Migratie 0007 voegde dit rolgebaseerde insert/update/delete-
-- patroon destijds toe aan quote_blocks/quote_packages/quote_addons/
-- comments/etc., maar miste quote_versions.

create policy "org members can write own quote_versions" on quote_versions for insert
  with check (
    current_user_role() != 'readonly'
    and quote_id in (select id from quotes where organization_id = current_organization_id())
  );
