import "server-only";
import { createHash } from "crypto";

/** Deterministische JSON-stringify (gesorteerde keys) zodat dezelfde data
 * altijd exact dezelfde hash oplevert, ongeacht key-volgorde. */
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      sorted[key] = canonicalize((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return value;
}

/** SHA-256 hash van het exacte document (offerte + blokken + selectie) zoals
 * het op het moment van ondertekenen werd getoond — zie sectie 3.6. */
export function hashSnapshot(snapshot: unknown): string {
  const json = JSON.stringify(canonicalize(snapshot));
  return createHash("sha256").update(json, "utf8").digest("hex");
}
