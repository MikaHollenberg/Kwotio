-- Automatische NL->EN vertaling van offerte-inhoud (via Claude API).
-- content_en bevat alleen de vertaalde tekstvelden, geadresseerd op de
-- bestaande stabiele block-/pakket-/optie-/item-ids i.p.v. array-index.
-- Niet-tekstuele velden (prijzen, foto's, ids) blijven ongewijzigd en worden
-- bij het laden samengevoegd met de NL-content. Zie app/src/lib/translation/.

alter table quote_blocks add column content_en jsonb;
