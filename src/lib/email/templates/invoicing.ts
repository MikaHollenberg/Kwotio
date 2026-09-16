import { emailShell, textToSafeHtml } from "./base";
import { formatCurrency, formatDate } from "@/lib/utils";

export function invoiceSentClientEmail(input: {
  organizationName: string;
  invoiceNumber: string;
  invoiceTypeLabel: string;
  totalInclVat: number;
  dueDate: string;
  termsUrl: string | null;
  privacyUrl: string;
  /** Eigen berichttekst uit Instellingen → Facturatie (al door
   * `renderEmailTemplate` gerenderd, dus met `{{klantnaam}}` etc. al
   * ingevuld) -- ontbreekt dit, dan blijft de ingebouwde standaardtekst
   * gelden. */
  customBodyText?: string | null;
}) {
  const bodyParagraph = input.customBodyText
    ? textToSafeHtml(input.customBodyText)
    : `Bijgaand ontvang je ${input.invoiceTypeLabel.toLowerCase()} <strong>${input.invoiceNumber}</strong> van
        ${input.organizationName}, ter waarde van <strong>${formatCurrency(input.totalInclVat)}</strong> (incl. btw).
        Wij verzoeken je dit bedrag te voldoen vóór <strong>${formatDate(input.dueDate)}</strong>, onder vermelding
        van het factuurnummer. De volledige factuur vind je als bijlage bij deze e-mail.`;

  return emailShell({
    organizationName: input.organizationName,
    preheader: `${input.invoiceTypeLabel} ${input.invoiceNumber} van ${input.organizationName}`,
    bodyHtml: `
      <h1 style="font-size:20px;margin:0 0 12px;">${input.invoiceTypeLabel} ${input.invoiceNumber}</h1>
      <p style="font-size:14px;line-height:1.6;color:#46626E;margin:0 0 20px;">
        ${bodyParagraph}
      </p>
    `,
    termsUrl: input.termsUrl,
    privacyUrl: input.privacyUrl,
  });
}

export function invoiceOverdueReminderEmail(input: {
  organizationName: string;
  invoiceNumber: string;
  invoiceTypeLabel: string;
  totalInclVat: number;
  dueDate: string;
  privacyUrl: string;
  customBodyText?: string | null;
}) {
  const bodyParagraph = input.customBodyText
    ? textToSafeHtml(input.customBodyText)
    : `De vervaldatum van ${input.invoiceTypeLabel.toLowerCase()} <strong>${input.invoiceNumber}</strong>
        (<strong>${formatCurrency(input.totalInclVat)}</strong>, incl. btw) van ${input.organizationName} is op
        <strong>${formatDate(input.dueDate)}</strong> verstreken. Heb je deze al voldaan, dan mag je deze
        e-mail negeren -- is dat nog niet gebeurd, wil je dit dan alsnog zo snel mogelijk overmaken, onder
        vermelding van het factuurnummer?`;

  return emailShell({
    organizationName: input.organizationName,
    preheader: `${input.invoiceTypeLabel} ${input.invoiceNumber} is nog niet betaald`,
    bodyHtml: `
      <h1 style="font-size:20px;margin:0 0 12px;">Herinnering: ${input.invoiceNumber}</h1>
      <p style="font-size:14px;line-height:1.6;color:#46626E;margin:0 0 20px;">
        ${bodyParagraph}
      </p>
    `,
    privacyUrl: input.privacyUrl,
  });
}
