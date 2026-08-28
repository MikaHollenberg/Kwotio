-- Op verzoek: geen los BTW-percentage meer op de offerte. In plaats daarvan
-- alleen een label of prijzen incl. of excl. btw worden weergegeven.

create type price_display_mode as enum ('incl_btw', 'excl_btw');

alter table quotes add column price_display price_display_mode not null default 'incl_btw';
alter table quotes drop column vat_rate;

alter table organizations drop column default_vat_rate;
