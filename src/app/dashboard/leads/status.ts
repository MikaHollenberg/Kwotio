import { tones } from "@/components/ui/badge";
import type { LeadPurpose, LeadStatus } from "@/lib/types/database";

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  nieuw: "Nieuw",
  gecontacteerd: "Gecontacteerd",
  omgezet: "Omgezet",
  afgewezen: "Afgewezen",
};

export const LEAD_STATUS_TONES: Record<LeadStatus, keyof typeof tones> = {
  nieuw: "blue",
  gecontacteerd: "yellow",
  omgezet: "green",
  afgewezen: "red",
};

export const LEAD_PURPOSE_LABELS: Record<LeadPurpose, string> = {
  uitje: "Uitje",
  arrangement: "Arrangement",
  overig: "Overig",
};
