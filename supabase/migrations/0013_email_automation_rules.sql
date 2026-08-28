-- Vervangt de twee vaste e-mail-instellingen (reminder_after_days +
-- reminder_email_*/event_reminder_email_* op organizations, uit migratie
-- 0012) door een zelf te beheren lijst met regels: het bureau kan nu
-- meerdere e-mails toevoegen/verwijderen, elk met een eigen triggermoment
-- (aantal dagen) en eigen inhoud. Migratie 0012 stond nog maar net live en
-- niets anders hangt er nog van af, dus dit is een schone vervanging, geen
-- backwards-compat-laag.

create type email_trigger_type as enum ('days_after_sent_no_reaction', 'days_before_event');

create table email_automation_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  trigger_type email_trigger_type not null,
  trigger_days integer not null,
  subject text not null,
  body text not null,
  enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index email_automation_rules_organization_id_idx on email_automation_rules(organization_id);

alter table email_automation_rules enable row level security;

create policy "org members can read own email_automation_rules" on email_automation_rules for select
  using (organization_id = current_organization_id());
create policy "org admins can insert own email_automation_rules" on email_automation_rules for insert
  with check (organization_id = current_organization_id() and current_user_role() in ('owner', 'admin'));
create policy "org admins can update own email_automation_rules" on email_automation_rules for update
  using (organization_id = current_organization_id() and current_user_role() in ('owner', 'admin'));
create policy "org admins can delete own email_automation_rules" on email_automation_rules for delete
  using (organization_id = current_organization_id() and current_user_role() in ('owner', 'admin'));

create trigger email_automation_rules_set_updated_at before update on email_automation_rules
  for each row execute function set_updated_at();

-- Bestaande instellingen overzetten naar rijen (met fallback op de defaults
-- die tot nu toe in de code stonden, voor het geval reminder_email_subject
-- etc. nog nooit ingevuld waren).
insert into email_automation_rules (organization_id, name, trigger_type, trigger_days, subject, body, sort_order)
select
  id,
  'Herinnering - nog geen reactie',
  'days_after_sent_no_reaction',
  reminder_after_days,
  coalesce(reminder_email_subject, 'Nog een seintje: je offerte "{{offertetitel}}"'),
  coalesce(reminder_email_body, 'Hoi {{klantnaam}}, we zagen dat je offerte {{offertetitel}} nog openstaat. Heb je nog vragen of wil je ''m bevestigen? We horen het graag.'),
  0
from organizations;

insert into email_automation_rules (organization_id, name, trigger_type, trigger_days, subject, body, sort_order)
select
  id,
  'Evenement-herinnering',
  'days_before_event',
  14,
  coalesce(event_reminder_email_subject, 'Nog 2 weken tot {{evenementdatum}}! 🎉'),
  coalesce(event_reminder_email_body, 'Hoi {{klantnaam}}, over twee weken, op {{evenementdatum}}, is het zover voor {{offertetitel}}! We kijken ernaar uit. Nog vragen of laatste wijzigingen? Laat het ons gerust weten.'),
  1
from organizations;

alter table organizations
  drop column reminder_after_days,
  drop column reminder_email_subject,
  drop column reminder_email_body,
  drop column event_reminder_email_subject,
  drop column event_reminder_email_body;
