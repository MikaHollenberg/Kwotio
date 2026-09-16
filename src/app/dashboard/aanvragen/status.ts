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

/** Twee aanvragen van hetzelfde e-mailadres of telefoonnummer kort na elkaar
 * zijn vaak een dubbele indiening (bijv. per ongeluk twee keer verzonden, of
 * twee keer omdat de klant dacht dat het niet gelukt was) — dan is het
 * handig om dat meteen te zien voordat je de klant twee keer los benadert. */
export const DUPLICATE_REQUEST_WINDOW_HOURS = 48;

function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9+]/g, "");
}

function groupWithinWindow<T extends { id: string; created_at: string }>(groups: Map<string, T[]>, duplicates: Set<string>) {
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const diffHours =
          Math.abs(new Date(group[i].created_at).getTime() - new Date(group[j].created_at).getTime()) / (60 * 60 * 1000);
        if (diffHours <= DUPLICATE_REQUEST_WINDOW_HOURS) {
          duplicates.add(group[i].id);
          duplicates.add(group[j].id);
        }
      }
    }
  }
}

export function findDuplicateRequestIds<
  T extends { id: string; customer_email: string | null; customer_phone: string | null; created_at: string },
>(requests: T[]): Set<string> {
  const byEmail = new Map<string, T[]>();
  const byPhone = new Map<string, T[]>();
  for (const r of requests) {
    if (r.customer_email) {
      const key = r.customer_email.trim().toLowerCase();
      (byEmail.get(key) ?? byEmail.set(key, []).get(key)!).push(r);
    }
    if (r.customer_phone) {
      const key = normalizePhone(r.customer_phone);
      if (key) (byPhone.get(key) ?? byPhone.set(key, []).get(key)!).push(r);
    }
  }

  const duplicates = new Set<string>();
  groupWithinWindow(byEmail, duplicates);
  groupWithinWindow(byPhone, duplicates);
  return duplicates;
}
