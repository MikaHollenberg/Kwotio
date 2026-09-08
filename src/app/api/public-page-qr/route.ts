import { NextResponse, type NextRequest } from "next/server";
import QRCode from "qrcode";

/**
 * Downloadbare QR-code (PNG) voor de publieke offertepagina van een
 * organisatie -- handig om te printen op flyers/tafelkaartjes of te delen op
 * social media. Neemt bewust alleen een `slug` (geen vrije `url`) en bouwt de
 * doel-URL zelf op basis van het huidige host -- zo kan deze route niet
 * misbruikt worden als generieke QR-generator voor willekeurige externe URL's.
 */
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug") ?? "";
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) {
    return NextResponse.json({ error: "Ongeldige slug" }, { status: 400 });
  }

  const origin = `${request.nextUrl.protocol}//${request.nextUrl.host}`;
  const targetUrl = `${origin}/offertes/${slug}`;

  const png = await QRCode.toBuffer(targetUrl, {
    type: "png",
    width: 800,
    margin: 2,
    color: { dark: "#2A2A28", light: "#FFFFFF" },
  });

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="offertepagina-qr-${slug}.png"`,
      "Cache-Control": "no-store",
    },
  });
}
