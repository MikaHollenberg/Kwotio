-- Bijhouden of een gebruiker de rondleiding door de app al gezien heeft
-- (skippen telt ook als "gezien" -- de rondleiding blijft daarna altijd
-- opnieuw op te starten via een los knopje, dit veld stuurt alleen de
-- automatische eerste-keer-prompt aan).
alter table profiles add column onboarding_tour_seen_at timestamptz;
