import { emailShell, emailButton } from "./base";
import { formatCurrency } from "@/lib/utils";

export function signingConfirmationClientEmail(input: {
  organizationName: string;
  quoteTitle: string;
  signerName: string;
  total: number;
  currency: string;
  shareUrl: string;
  termsUrl: string | null;
  privacyUrl: string;
}) {
  return emailShell({
    organizationName: input.organizationName,
    preheader: `Je hebt de offerte "${input.quoteTitle}" ondertekend.`,
    bodyHtml: `
      <h1 style="font-size:20px;margin:0 0 12px;">Bedankt, ${input.signerName}! 🎉</h1>
      <p style="font-size:14px;line-height:1.6;color:#46626E;margin:0 0 20px;">
        Je hebt de offerte <strong>${input.quoteTitle}</strong> succesvol ondertekend voor
        een totaalbedrag van <strong>${formatCurrency(input.total, input.currency)}</strong>.
        Het ondertekeningscertificaat vind je als bijlage bij deze e-mail.
      </p>
      ${emailButton("Bekijk je offerte", input.shareUrl)}
      <p style="font-size:13px;color:#7C8F97;margin-top:24px;">
        ${input.organizationName} neemt binnenkort contact met je op om alles verder af te stemmen.
      </p>
    `,
    termsUrl: input.termsUrl,
    privacyUrl: input.privacyUrl,
  });
}

export function quoteEditedAfterSigningClientEmail(input: {
  organizationName: string;
  signerName: string;
  quoteTitle: string;
  shareUrl: string;
  termsUrl: string | null;
  privacyUrl: string;
}) {
  return emailShell({
    organizationName: input.organizationName,
    preheader: `Er is een wijziging doorgevoerd in "${input.quoteTitle}".`,
    bodyHtml: `
      <h1 style="font-size:20px;margin:0 0 12px;">Update over je offerte</h1>
      <p style="font-size:14px;line-height:1.6;color:#46626E;margin:0 0 20px;">
        Hoi ${input.signerName}, ${input.organizationName} heeft de door jou geaccepteerde offerte
        <strong>${input.quoteTitle}</strong> zojuist aangepast. Bekijk hieronder de actuele versie.
      </p>
      ${emailButton("Bekijk de offerte", input.shareUrl)}
    `,
    termsUrl: input.termsUrl,
    privacyUrl: input.privacyUrl,
  });
}

export function signingNotificationAgencyEmail(input: {
  organizationName: string;
  quoteTitle: string;
  signerName: string;
  signerEmail: string;
  total: number;
  currency: string;
  dashboardUrl: string;
}) {
  return emailShell({
    organizationName: input.organizationName,
    preheader: `${input.signerName} heeft "${input.quoteTitle}" ondertekend.`,
    bodyHtml: `
      <h1 style="font-size:20px;margin:0 0 12px;">Offerte ondertekend ✍️</h1>
      <p style="font-size:14px;line-height:1.6;color:#46626E;margin:0 0 20px;">
        <strong>${input.signerName}</strong> (${input.signerEmail}) heeft zojuist
        <strong>${input.quoteTitle}</strong> ondertekend voor een totaalbedrag van
        <strong>${formatCurrency(input.total, input.currency)}</strong>.
      </p>
      ${emailButton("Bekijk in dashboard", input.dashboardUrl)}
    `,
  });
}
