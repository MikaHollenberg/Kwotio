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
