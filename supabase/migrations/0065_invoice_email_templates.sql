-- Zelf aanpasbare inhoud voor de twee factuur-e-mailmomenten (verstuur-mail
-- en herinneringsmail bij een vervallen betaaldatum) -- zelfde idee als de
-- bestaande e-mailautomatisering bij offertes (`email_automation_rules`),
-- maar simpeler: hier zijn maar twee vaste triggermomenten, geen losse
-- regels-tabel nodig. NULL = de ingebouwde standaardtekst blijft gelden
-- (zie `invoiceSentClientEmail`/`invoiceOverdueReminderEmail`).

alter table organizations
  add column invoice_sent_email_subject text,
  add column invoice_sent_email_body text,
  add column invoice_reminder_email_subject text,
  add column invoice_reminder_email_body text;
