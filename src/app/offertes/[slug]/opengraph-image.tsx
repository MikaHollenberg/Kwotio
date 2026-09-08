import { ImageResponse } from "next/og";
import { headers } from "next/headers";
import { getPublicOrgPageData } from "./data";

export const alt = "Offertepagina";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [data, h] = await Promise.all([getPublicOrgPageData(slug), headers()]);
  const orgName = data?.organizationName ?? "Kwotio";
  const accentColor = data?.primaryColor ?? "#CC7A3E";
  // Satori (de renderer achter ImageResponse) draait server-side zonder
  // browsercontext en heeft daarom een absolute logo-URL nodig — bestaande
  // logo's kunnen nog een relatief pad zijn (bv. Caribbean Bar's eigen
  // gebundelde asset uit Fase 8, zie HANDOVER.md).
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const logoSrc = data?.logoUrl ? (data.logoUrl.startsWith("/") ? `${origin}${data.logoUrl}` : data.logoUrl) : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#FBF6EC",
          padding: 80,
        }}
      >
        {logoSrc ? (
          <img src={logoSrc} alt="" height={140} style={{ objectFit: "contain", marginBottom: 48 }} />
        ) : (
          <div style={{ fontSize: 96, color: accentColor, marginBottom: 40, display: "flex" }}>&ldquo;</div>
        )}
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: "#1E2E38",
            textAlign: "center",
            display: "flex",
          }}
        >
          {orgName}
        </div>
        <div style={{ fontSize: 32, color: "#46626E", marginTop: 20, display: "flex" }}>
          Bekijk onze offertes en vraag er direct één aan
        </div>
      </div>
    ),
    { ...size },
  );
}
