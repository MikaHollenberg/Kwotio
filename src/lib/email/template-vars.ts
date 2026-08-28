/** Vervangt `{{variabele}}`-placeholders in door het bureau zelf ingevulde
 * e-mailteksten. Onbekende placeholders blijven letterlijk staan i.p.v.
 * stilzwijgend leeg te worden — zo valt een typefout in eigen tekst meteen
 * op in plaats van onopgemerkt te verdwijnen. */
export function renderEmailTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : match,
  );
}
