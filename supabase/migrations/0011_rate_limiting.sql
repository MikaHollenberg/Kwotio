-- Fase 5 beveiligingsplan: app-niveau rate limiting op gevoelige, publieke
-- endpoints die geen Supabase Auth-aanroep zijn (Supabase's eigen
-- Auth-limieten dekken dat al, maar niet het opvragen van een offerte via
-- token). Geen nieuwe externe dependency (Redis e.d.) nodig -- hergebruikt
-- de al aanwezige Postgres-database. Rijen worden opgeruimd door de
-- bestaande dagelijkse cron (zie app/src/app/api/cron/notifications).

create table rate_limit_hits (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  identifier text not null,
  created_at timestamptz not null default now()
);
create index rate_limit_hits_lookup_idx on rate_limit_hits(bucket, identifier, created_at);

-- Service-role-only tabel (geen enkele bureau-/klantfunctionaliteit hoort
-- deze rechtstreeks te lezen/schrijven) -- RLS aan, bewust geen policies.
alter table rate_limit_hits enable row level security;
