/** Gedeelde e-mail-huisstijl: zelfde kleuren als het portaal, inline CSS
 * (nodig voor e-mailclients — geen externe stylesheets/fonts).
 * `termsUrl`/`privacyUrl` zijn optioneel: alleen client-facing e-mails (niet
 * de interne bureau-notificaties) tonen deze regel in de footer. */
export function emailShell(opts: {
  organizationName: string;
  preheader: string;
  bodyHtml: string;
  termsUrl?: string;
  privacyUrl?: string;
}) {
  const legalLine =
    opts.termsUrl || opts.privacyUrl
      ? `<br/>${[
          opts.termsUrl ? `<a href="${opts.termsUrl}" style="color:#46626E;">Algemene voorwaarden</a>` : null,
          opts.privacyUrl ? `<a href="${opts.privacyUrl}" style="color:#46626E;">Privacybeleid</a>` : null,
        ]
          .filter(Boolean)
          .join(" · ")}`
      : "";

  return `<!doctype html>
<html lang="nl">
  <body style="margin:0;padding:0;background-color:#FBF6EC;font-family:Arial,Helvetica,sans-serif;color:#1E2E38;">
    <span style="display:none;max-height:0;overflow:hidden;">${opts.preheader}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FBF6EC;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:20px;overflow:hidden;">
            <tr>
              <td style="background-color:#1E2E38;padding:24px 32px;">
                <span style="color:#ffffff;font-size:16px;font-weight:bold;">${opts.organizationName}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                ${opts.bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background-color:#F3EBDA;font-size:12px;color:#46626E;">
                ${opts.organizationName} · feestaanhetwater.nl${legalLine}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** Zet door het bureau zelf getypte tekst (uit een gewoon tekstvak, geen
 * rich text) veilig om naar HTML: entities escapen, regeleinden naar <br/>. */
export function textToSafeHtml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped.replace(/\n/g, "<br/>");
}

export function emailButton(label: string, url: string) {
  return `<a href="${url}" style="display:inline-block;background-color:#CC7A3E;color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;padding:12px 24px;border-radius:12px;">${label}</a>`;
}
