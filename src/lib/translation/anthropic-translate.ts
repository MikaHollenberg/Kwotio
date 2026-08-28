import "server-only";
import Anthropic from "@anthropic-ai/sdk";

// Haiku is snel/goedkoop en ruim voldoende voor het vertalen van korte
// offertetekst (koppen, pakketomschrijvingen, tijdlijn-items).
const MODEL = "claude-haiku-4-5-20251001";

const SYSTEM_PROMPT = `Je vertaalt tekst uit een Nederlandse zakelijke offerte (feestlocatie- en bootverhuurbedrijf) naar natuurlijk Engels.

Regels:
- Vertaal elke tekst in de lijst afzonderlijk, in dezelfde volgorde.
- Geef exact evenveel vertalingen terug als er teksten zijn aangeleverd.
- Als een tekst HTML-tags bevat (bijv. <p>, <strong>, <em>, <ul>, <li>), behoud die tags exact en op dezelfde plek — vertaal alleen de leesbare tekst ertussen.
- Vertaal geen namen van het bedrijf zelf.
- Geef alleen de vertaling terug, geen toelichting.`;

export type TranslateResult =
  | { ok: true; translations: string[] }
  | { ok: false; reason: "not_configured" }
  | { ok: false; reason: "api_error"; error: string };

export async function translateTexts(texts: string[]): Promise<TranslateResult> {
  if (texts.length === 0) return { ok: true, translations: [] };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("translateTexts: ANTHROPIC_API_KEY ontbreekt, vertaling overgeslagen.");
    return { ok: false, reason: "not_configured" };
  }

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: JSON.stringify(texts) }],
      tools: [
        {
          name: "return_translations",
          description: "Geef de vertaalde teksten terug, in dezelfde volgorde en hetzelfde aantal als de invoer.",
          input_schema: {
            type: "object",
            properties: {
              translations: { type: "array", items: { type: "string" } },
            },
            required: ["translations"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "return_translations" },
    });

    const toolUse = response.content.find((block) => block.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      return { ok: false, reason: "api_error", error: "Geen gestructureerd antwoord ontvangen." };
    }

    const translations = (toolUse.input as { translations?: unknown }).translations;
    if (!Array.isArray(translations) || translations.length !== texts.length) {
      return { ok: false, reason: "api_error", error: "Aantal vertalingen komt niet overeen met de invoer." };
    }

    return { ok: true, translations: translations.map((t) => String(t)) };
  } catch (error) {
    console.error("translateTexts: Claude API-fout", error);
    return { ok: false, reason: "api_error", error: "Er ging iets mis bij het vertalen. Probeer het later opnieuw." };
  }
}
