import "server-only";
import { Resend } from "resend";

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: Buffer }[];
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      `[email] RESEND_API_KEY niet geconfigureerd — e-mail "${input.subject}" naar ${input.to} is niet verstuurd.`,
    );
    return { skipped: true };
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "Caribbean Bar Uitgeest <onboarding@resend.dev>",
    to: input.to,
    subject: input.subject,
    html: input.html,
    attachments: input.attachments?.map((a) => ({ filename: a.filename, content: a.content })),
  });

  if (error) {
    console.error("[email] Verzenden mislukt:", error);
    return { skipped: false, error };
  }
  return { skipped: false };
}
