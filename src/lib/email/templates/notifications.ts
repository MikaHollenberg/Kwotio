import { emailShell, emailButton, textToSafeHtml } from "./base";
import { formatCurrency } from "@/lib/utils";

export function quoteReceivedClientEmail(input: {
  organizationName: string;
  clientName: string;
  quoteTitle: string;
  shareUrl: string;
  termsUrl: string;
  privacyUrl: string;
}) {
  return emailShell({
    organizationName: input.organizationName,
    preheader: `Je hebt een nieuwe offerte ontvangen: ${input.quoteTitle}`,
    bodyHtml: `
      <h1 style="font-size:20px;margin:0 0 12px;">Hoi ${input.clientName}! 🌴</h1>
      <p style="font-size:14px;line-height:1.6;color:#46626E;margin:0 0 20px;">
        ${input.organizationName} heeft een offerte voor je klaargezet:
        <strong>${input.quoteTitle}</strong>. Bekijk 'm hieronder, kies je pakket
        en laat gerust een reactie achter als je nog vragen hebt.
      </p>
      ${emailButton("Bekijk je offerte", input.shareUrl)}
    `,
    termsUrl: input.termsUrl,
    privacyUrl: input.privacyUrl,
  });
}

export function quoteOpenedAgencyEmail(input: {
  organizationName: string;
  quoteTitle: string;
  clientName: string;
  dashboardUrl: string;
}) {
  return emailShell({
    organizationName: input.organizationName,
    preheader: `${input.clientName} heeft "${input.quoteTitle}" geopend.`,
    bodyHtml: `
      <h1 style="font-size:20px;margin:0 0 12px;">Offerte geopend 👀</h1>
      <p style="font-size:14px;line-height:1.6;color:#46626E;margin:0 0 20px;">
        <strong>${input.clientName}</strong> heeft zojuist voor het eerst
        <strong>${input.quoteTitle}</strong> geopend.
      </p>
      ${emailButton("Bekijk in dashboard", input.dashboardUrl)}
    `,
  });
}

export function newCommentAgencyEmail(input: {
  organizationName: string;
  quoteTitle: string;
  authorName: string;
  body: string;
  dashboardUrl: string;
}) {
  return emailShell({
    organizationName: input.organizationName,
    preheader: `Nieuwe reactie van ${input.authorName} op "${input.quoteTitle}"`,
    bodyHtml: `
      <h1 style="font-size:20px;margin:0 0 12px;">Nieuwe reactie 💬</h1>
      <p style="font-size:14px;line-height:1.6;color:#46626E;margin:0 0 12px;">
        <strong>${input.authorName}</strong> heeft een reactie achtergelaten op
        <strong>${input.quoteTitle}</strong>:
      </p>
      <p style="font-size:14px;line-height:1.6;color:#1E2E38;background:#FBF6EC;border-radius:12px;padding:12px 16px;margin:0 0 20px;">
        "${input.body}"
      </p>
      ${emailButton("Beantwoorden", input.dashboardUrl)}
    `,
  });
}

export function reminderClientEmail(input: {
  organizationName: string;
  quoteTitle: string;
  bodyText: string;
  shareUrl: string;
  termsUrl: string;
  privacyUrl: string;
}) {
  return emailShell({
    organizationName: input.organizationName,
    preheader: `Even een seintje over je offerte "${input.quoteTitle}".`,
    bodyHtml: `
      <h1 style="font-size:20px;margin:0 0 12px;">Nog een keertje kijken? ☀️</h1>
      <p style="font-size:14px;line-height:1.6;color:#46626E;margin:0 0 20px;">
        ${textToSafeHtml(input.bodyText)}
      </p>
      ${emailButton("Bekijk je offerte", input.shareUrl)}
    `,
    termsUrl: input.termsUrl,
    privacyUrl: input.privacyUrl,
  });
}

export function eventReminderClientEmail(input: {
  organizationName: string;
  quoteTitle: string;
  bodyText: string;
  shareUrl: string;
  termsUrl: string;
  privacyUrl: string;
}) {
  return emailShell({
    organizationName: input.organizationName,
    preheader: `Nog 2 weken tot je evenement: "${input.quoteTitle}".`,
    bodyHtml: `
      <h1 style="font-size:20px;margin:0 0 12px;">Bijna zover! 🎉</h1>
      <p style="font-size:14px;line-height:1.6;color:#46626E;margin:0 0 20px;">
        ${textToSafeHtml(input.bodyText)}
      </p>
      ${emailButton("Bekijk je offerte", input.shareUrl)}
    `,
    termsUrl: input.termsUrl,
    privacyUrl: input.privacyUrl,
  });
}

export function expiringSoonAgencyEmail(input: {
  organizationName: string;
  quoteTitle: string;
  clientName: string;
  total: number;
  currency: string;
  validUntil: string;
  dashboardUrl: string;
}) {
  return emailShell({
    organizationName: input.organizationName,
    preheader: `"${input.quoteTitle}" verloopt bijna.`,
    bodyHtml: `
      <h1 style="font-size:20px;margin:0 0 12px;">Offerte verloopt bijna ⏳</h1>
      <p style="font-size:14px;line-height:1.6;color:#46626E;margin:0 0 20px;">
        <strong>${input.quoteTitle}</strong> voor ${input.clientName}
        (${formatCurrency(input.total, input.currency)}) is geldig tot ${input.validUntil}
        en is nog niet geaccepteerd. Misschien tijd voor een belletje?
      </p>
      ${emailButton("Bekijk in dashboard", input.dashboardUrl)}
    `,
  });
}
