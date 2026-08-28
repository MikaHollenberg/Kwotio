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
 * (`rich-text-editor.tsx`): alleen p, strong/b, em/i, ul/ol/li, h1-h6, br.
 * Onbekende tags worden genegeerd (tekst blijft staan, opmaak vervalt) i.p.v.
 * te crashen — bedoeld voor @react-pdf/renderer, dat geen HTML rendert.
 */
function parseInlineRuns(html: string): TextRun[] {
  const runs: TextRun[] = [];
  let bold = false;
  let italic = false;
  const tokenRe = /<(\/?)(strong|b|em|i|br)[^>]*>|([^<]+)/gi;
  let match: RegExpExecArray | null;
  while ((match = tokenRe.exec(html))) {
    const [, closing, tag, text] = match;
    if (text !== undefined) {
      const decoded = decodeEntities(text);
      if (decoded) runs.push({ text: decoded, bold, italic });
    } else if (tag === "br") {
      runs.push({ text: "\n", bold, italic });
    } else if (tag === "strong" || tag === "b") {
      bold = !closing;
    } else if (tag === "em" || tag === "i") {
      italic = !closing;
    }
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
