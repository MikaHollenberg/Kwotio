-- Beveiligingsaudit: Supabase's eigen security-advisor (get_advisors) meldde
-- dat alle onderstaande SECURITY DEFINER/trigger-functies een losse PUBLIC-
-- grant hadden staan naast/in plaats van specifieke rol-grants. In Postgres
-- geeft een grant aan de pseudo-rol PUBLIC uitvoerrechten aan ELKE rol
-- (dus ook `anon`, ongeacht of `anon` zelf ooit apart REVOKE'd is) -- zie
-- ook de eerdere, vergelijkbare lessen in migraties 0051/0059/0059. Dit
-- verklaart waarom next_invoice_number() nog steeds door `anon` aanroepbaar
-- bleek ondanks de eerdere `revoke ... from anon` in migratie 0051: de
-- PUBLIC-grant was nooit apart ingetrokken.
--
-- `current_organization_id()`/`current_user_role()`/`is_super_admin()`
-- worden ECHT gebruikt binnen RLS-policy-expressies voor ingelogde
-- gebruikers (rol `authenticated`) -- die grant blijft dus bewust staan.
-- Voor `anon` (nooit ingelogd) heeft geen enkele policy dit nodig: alle
-- publieke routes (offertepagina, aanvraagformulier) lopen via de
-- service-role-client, niet via een anon-sessie met RLS.
revoke execute on function public.current_organization_id() from public, anon;
revoke execute on function public.current_user_role() from public, anon;
revoke execute on function public.is_super_admin() from public, anon;

-- next_invoice_number(uuid) heeft al een eigen autorisatiecheck in de
-- functie zelf (migratie 0051) en wordt alleen aangeroepen door een
-- ingelogde owner/admin/member (rol `authenticated`) -- die grant blijft
-- staan, alleen de PUBLIC-blanco-grant (en daarmee impliciet `anon`) gaat
-- eraf.
revoke execute on function public.next_invoice_number(uuid) from public;

-- handle_new_user()/prevent_unsafe_profile_updates()/set_updated_at() zijn
-- alle drie uitsluitend trigger-functies (vuren automatisch op INSERT/
-- UPDATE) -- nooit ergens in de app-code als losse RPC aangeroepen, dus
-- geen enkele rol heeft hier iets aan directe uitvoerrechten. Zelfde
-- patroon als assign_client_number() (migratie 0059).
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.prevent_unsafe_profile_updates() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- "Function Search Path Mutable"-melding: zonder een vastgezet search_path
-- kan een functie in theorie misleid worden door een schema dat eerder in
-- het zoekpad staat dan `public`. ALTER FUNCTION (i.p.v. CREATE OR REPLACE)
-- past alleen de configuratie aan, zonder de zojuist ingetrokken grants
-- opnieuw naar de Supabase-standaard (PUBLIC + anon + authenticated) te
-- laten terugveren.
alter function public.set_updated_at() set search_path = public, pg_temp;
