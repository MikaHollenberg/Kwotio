export type TextRun = { text: string; bold: boolean; italic: boolean };

export type HtmlNode =
  | { type: "heading"; level: number; runs: TextRun[] }
  | { type: "paragraph"; runs: TextRun[] }
  | { type: "listItem"; ordered: boolean; index: number; runs: TextRun[] };

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  "#39": "'",
  nbsp: " ",
};

function decodeEntities(text: string): string {
  return text.replace(/&(#?\w+);/g, (match, name) => ENTITIES[name] ?? match);
}

/**
 * Beperkte HTML-parser voor content uit de TipTap StarterKit-editor
 * (`rich-text-editor.tsx`): alleen p, strong/b, em/i, ul/ol/li, h1-h6, br
 * krijgen daadwerkelijk effect. Élke andere/onbekende tag — inclusief een
 * <p> die TipTap standaard binnen een <li> nestelt, of een geneste
 * <ul>/<ol>/<li> van een sub-lijst — wordt hier als tag herkend en
 * overgeslagen (tekst blijft staan, opmaak/structuur vervalt) i.p.v. te
 * crashen. Bedoeld voor @react-pdf/renderer, dat geen HTML rendert.
 *
 * Belangrijk: de tag-alternatieven in tokenRe matchen bewust ELKE
 * geldige tagnaam (niet alleen de bekende), anders herkent de regex een
 * onbekende tag als geen-van-beide-alternatieven en valt hij terug op de
 * tekst-groep vanaf het teken ná de "<" — dat leverde precies de kapotte
 * "p&gt;...tekst.../p&gt;"-fragmenten op die in de PDF verschenen zodra een
 * lijst-item zijn tekst in een <p> had staan.
 */
function parseInlineRuns(html: string): TextRun[] {
  const runs: TextRun[] = [];
  let bold = false;
  let italic = false;
  const tokenRe = /<(\/?)([a-zA-Z][\w-]*)\b[^>]*>|([^<]+)/g;
  let match: RegExpExecArray | null;
  while ((match = tokenRe.exec(html))) {
    const [, closing, tag, text] = match;
    if (text !== undefined) {
      const decoded = decodeEntities(text);
      if (decoded) runs.push({ text: decoded, bold, italic });
      continue;
    }
    const tagName = tag.toLowerCase();
    if (tagName === "br") {
      runs.push({ text: "\n", bold, italic });
    } else if (tagName === "strong" || tagName === "b") {
      bold = !closing;
    } else if (tagName === "em" || tagName === "i") {
      italic = !closing;
    }
    // Alle andere tags (p, span, div, ul, ol, li, ...) worden bewust
    // genegeerd: overgeslagen i.p.v. als letterlijke tekst te lekken.
  }
  return runs;
}

export function parseHtmlNodes(html: string): HtmlNode[] {
  if (!html) return [];
  const nodes: HtmlNode[] = [];
  const blockRe = /<(p|h[1-6]|ul|ol)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;
  while ((match = blockRe.exec(html))) {
    const [, tag, inner] = match;
    if (tag === "ul" || tag === "ol") {
      const ordered = tag === "ol";
      const liRe = /<li[^>]*>([\s\S]*?)<\/li>/gi;
      let liMatch: RegExpExecArray | null;
      let index = 1;
      while ((liMatch = liRe.exec(inner))) {
        const runs = parseInlineRuns(liMatch[1]);
        if (runs.length) nodes.push({ type: "listItem", ordered, index: index++, runs });
      }
    } else if (tag.startsWith("h")) {
      const runs = parseInlineRuns(inner);
      if (runs.length) nodes.push({ type: "heading", level: Number(tag[1]), runs });
    } else {
      const runs = parseInlineRuns(inner);
      if (runs.length) nodes.push({ type: "paragraph", runs });
    }
  }
  return nodes;
}
