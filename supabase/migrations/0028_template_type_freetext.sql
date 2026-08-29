-- "Eventtype" op een template was een vaste keuzelijst (enum) — op verzoek
-- van de gebruiker wordt dit een vrij invulbaar tekstveld ("Type offerte"),
-- zodat een bureau zelf een naam kan intypen i.p.v. te kiezen uit een vooraf
-- ingestelde lijst. Kolomnaam blijft event_type (betekenis ongewijzigd),
-- alleen het onderliggende type verandert van enum naar text.

alter table templates alter column event_type type text using event_type::text;

-- Bestaande waarden waren enum-slugs (kleine letters) die via een vaste
-- label-lookup in de UI getoond werden (bv. 'bedrijfsuitje' -> "Bedrijfsuitje").
-- Die lookup bestaat niet meer nu het vrije tekst is — zet bestaande rijen om
-- naar hun oude weergavelabel zodat ze er niet opeens anders uitzien.
update templates set event_type = case event_type
  when 'bedrijfsuitje' then 'Bedrijfsuitje'
  when 'vrijgezellenfeest' then 'Vrijgezellenfeest'
  when 'trouwerij' then 'Trouwerij'
  when 'familiedag' then 'Familiedag'
  when 'teambuilding' then 'Teambuilding'
  when 'overig' then 'Overig'
  else event_type
end;

alter table templates alter column event_type set default 'Overig';

drop type event_type;
