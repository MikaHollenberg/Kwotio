"use client";

import { useEffect } from "react";

/**
 * Vangt een crash in de root-layout zelf op (extreem zeldzaam) — dit
 * bestand vervangt dan de hele root-layout, dus geen globals.css/next-font
 * beschikbaar (zie Next.js' eigen waarschuwing hierover). Eigen, minimale
 * inline-styling i.p.v. de gedeelde componenten/tokens.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="nl">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: 24,
          textAlign: "center",
          background: "#fbf6ec",
          color: "#1e2e38",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <svg viewBox="0 0 100 100" width={96} height={96} aria-hidden="true">
          <path
            d="M35 30 L65 30 L60 55 L70 55 L45 85 L50 60 L40 60 Z"
            fill="none"
            stroke="#dc2626"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M28 22 Q32 16 38 20 M72 22 Q68 16 62 20"
            stroke="#aab6bc"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Er ging iets goed mis</h1>
          <p style={{ marginTop: 8, fontSize: 14, color: "#46626e" }}>
            De cocktail is gevallen, en de bar zelf is meegescheurd. Probeer de pagina opnieuw te laden.
          </p>
        </div>
        <button
          onClick={retry}
          style={{
            border: "1px solid #aab6bc",
            background: "#fff",
            color: "#1e2e38",
            borderRadius: 16,
            padding: "8px 16px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Probeer opnieuw
        </button>
      </body>
    </html>
  );
}
