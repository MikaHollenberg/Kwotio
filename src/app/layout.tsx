import type { Metadata } from "next";
import { Bricolage_Grotesque, Manrope } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

// Nodig voor absolute og:image-URL's (bv. de publieke organisatiepagina's
// gegenereerde deel-preview) — social-media-crawlers vereisen een volledig
// gekwalificeerde URL, geen relatief pad. Geen losse env-var: Vercel zet
// VERCEL_URL vanzelf, lokaal valt dit terug op localhost.
const siteUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Caribbean Bar Uitgeest — Offertes",
    template: "%s · Caribbean Bar Uitgeest",
  },
  description:
    "Offerte- en klantportaal van Feest aan het Water / Caribbean Bar Uitgeest.",
  icons: {
    icon: "/brand/icoon-zon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="nl"
      className={`${bricolage.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-sand-100 text-ink-500">
        {children}
      </body>
    </html>
  );
}
