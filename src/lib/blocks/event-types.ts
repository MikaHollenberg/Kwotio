import type { EventType } from "@/lib/types/database";
import type { ThemeIconKey } from "@/components/brand/theme-icon";

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  bedrijfsuitje: "Bedrijfsuitje",
  vrijgezellenfeest: "Vrijgezellenfeest",
  trouwerij: "Trouwerij",
  familiedag: "Familiedag",
  teambuilding: "Teambuilding",
  overig: "Overig",
};

export const EVENT_TYPE_ICONS: Record<EventType, ThemeIconKey> = {
  bedrijfsuitje: "zon",
  vrijgezellenfeest: "cocktail",
  trouwerij: "zon",
  familiedag: "bbq",
  teambuilding: "zeilboot",
  overig: "zon",
};

export const EVENT_TYPE_OPTIONS = Object.entries(EVENT_TYPE_LABELS) as [EventType, string][];
