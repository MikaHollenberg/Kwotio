import type { MetadataRoute } from "next";

// Offertes (/offerte/[token]) bevatten klant- en prijsgegevens en zijn
// uitsluitend bedoeld voor wie de deelbare link heeft — nooit crawlen/
// indexeren. De pagina zelf zet ook al `robots: noindex` (dubbele afdekking).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/offerte/",
    },
  };
}
