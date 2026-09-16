"use server";

import { createClient } from "@/lib/supabase/server";
import { getRecentNotifications, type NotificationItem } from "@/lib/notifications/queries";

export type NotificationsData = {
  items: NotificationItem[];
  unreadCount: number;
  /** profiles.notifications_seen_at op het moment van ophalen -- de client
   * gebruikt dit om per item de ongelezen-stip te bepalen, ook nadat
   * markNotificationsSeen() de teller alvast optimistisch op 0 heeft gezet. */
  seenAt: string;
};

const EMPTY: NotificationsData = { items: [], unreadCount: 0, seenAt: new Date().toISOString() };

/**
 * Haalt de meldingen op voor de ingelogde gebruiker + telt hoeveel daarvan
 * "ongelezen" zijn (nieuwer dan profiles.notifications_seen_at) -- geteld
 * binnen het opgehaalde venster, dus bij lang wegblijven kan het werkelijke
 * aantal hoger liggen dan getoond (de UI toont dan "9+"). Bewust geen aparte
 * COUNT-query per bron: dit blijft een klein bedrijf-schaal-dashboard, geen
 * poll-at-scale systeem.
 */
export async function getNotifications(): Promise<NotificationsData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return EMPTY;

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, notifications_seen_at")
    .eq("id", user.id)
    .single();
  if (!profile) return EMPTY;

  const items = await getRecentNotifications(supabase, profile.organization_id);
  const unreadCount = items.filter((i) => i.createdAt > profile.notifications_seen_at).length;

  return { items, unreadCount, seenAt: profile.notifications_seen_at };
}

/** Schuift het "ongelezen"-watermerk naar nu -- aangeroepen zodra de
 * meldingenbel geopend wordt (zelfde soort fire-and-forget "gezien"-vlag als
 * markTourSeen()). */
export async function markNotificationsSeen() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("profiles").update({ notifications_seen_at: new Date().toISOString() }).eq("id", user.id);
}
