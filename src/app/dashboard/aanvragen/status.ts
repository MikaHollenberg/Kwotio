import { tones } from "@/components/ui/badge";
import type { QuoteRequestStatus } from "@/lib/types/database";

export const REQUEST_STATUS_LABELS: Record<QuoteRequestStatus, string> = {
  nieuw: "Nieuw",
  in_behandeling: "In behandeling",
  omgezet: "Omgezet naar offerte",
  genegeerd: "Genegeerd",
};

export const REQUEST_STATUS_TONES: Record<QuoteRequestStatus, keyof typeof tones> = {
  nieuw: "blue",
  in_behandeling: "yellow",
  omgezet: "green",
  genegeerd: "neutral",
};

/** Snelheid van opvolging is cruciaal bij een nieuwe lead — een aanvraag die
 * langer dan dit blijft liggen zonder actie (nog steeds status "nieuw")
 * krijgt een zichtbare waarschuwing in de lijst en op het detailscherm. */
export const STALE_REQUEST_HOURS = 48;

export function isStaleRequest(status: QuoteRequestStatus, createdAt: string): boolean {
  if (status !== "nieuw") return false;
  const ageHours = (Date.now() - new Date(createdAt).getTime()) / (60 * 60 * 1000);
  return ageHours > STALE_REQUEST_HOURS;
}

export function staleRequestDays(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / (24 * 60 * 60 * 1000));
}
