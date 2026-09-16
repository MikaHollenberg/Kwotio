import type { NextConfig } from "next";

const supabaseHostname = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : null;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  // De factuur-PDF laadt Kwotio's eigen lettertypen (Bricolage Grotesque/
  // Manrope) als losse TTF-bestanden vanaf schijf (zie
  // src/lib/invoice-pdf/fonts.ts) i.p.v. via een import -- Next.js'
  // automatische file-tracing voor Vercel-serverless-functies pikt zulke
  // pas-op-runtime-berekende paden niet vanzelf op, dus expliciet
  // meegeven zodat de fonts ook in productie meegedeployed worden.
  outputFileTracingIncludes: {
    "/dashboard/facturen/**": ["./src/lib/invoice-pdf/fonts/**/*"],
  },
  images: {
    // De on-the-fly sharp-optimalisatiepijplijn faalt stil in lokale dev op
    // dit externe/exFAT-volume (gecorrumpeerde cache-writes) — zie
    // node_modules/next se "Slow filesystem detected"-waarschuwing. Op
    // Vercel (productie) speelt dit niet, dus daar willen we wél de volledige
    // next/image-optimalisatie voor de foto-rijke offertepagina's (Fase 7).
    unoptimized: process.env.NODE_ENV !== "production",
    remotePatterns: [
      ...(supabaseHostname
        ? [{ protocol: "https" as const, hostname: supabaseHostname, pathname: "/storage/v1/object/public/**" }]
        : []),
      { protocol: "https" as const, hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
};

export default nextConfig;
