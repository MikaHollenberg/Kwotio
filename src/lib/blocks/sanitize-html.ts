import DOMPurify from "isomorphic-dompurify";

/**
 * Whitelist matcht wat de TipTap-editor (`RichTextEditor`, StarterKit incl.
 * de ingebouwde Link-extensie voor autolinken) zelf kan produceren -- geen
 * `<img>`, `<script>`, `<style>`, of event-handler-attributen. Nodig omdat
 * `quote_blocks.content`/`template_blocks.content` gewone jsonb-kolommen
 * zijn: RLS bewaakt alleen wie mag schrijven (organisatie/rol), niet WAT er
 * geschreven wordt, dus een teamlid kan in theorie los van de editor-UI (bv.
 * rechtstreeks via de Supabase REST-API met een geldige sessie) willekeurige
 * HTML in een blok zetten. Dat wordt hier op het render-moment onschadelijk
 * gemaakt, ongeacht via welk pad het is opgeslagen -- inclusief de
 * vertaalde `content_en`-overlay, die dezelfde brontekst hergebruikt.
 * `href` op `<a>` blijft beperkt tot DOMPurify's eigen veilige-protocollen-
 * allowlist (http/https/mailto/tel/relatief) -- `javascript:` en andere
 * gevaarlijke schema's worden altijd gestript, ook al staat `a` toe.
 */
const ALLOWED_TAGS = ["p", "br", "strong", "b", "em", "i", "s", "strike", "u", "ul", "ol", "li", "h1", "h2", "h3", "blockquote", "code", "pre", "a"];

export function sanitizeBlockHtml(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR: ["href"] });
}
