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
    .select("organization_id, notifications_seen_at, dismissed_notification_ids")
    .eq("id", user.id)
    .single();
  if (!profile) return EMPTY;

  const dismissed = new Set(profile.dismissed_notification_ids);
  const items = (await getRecentNotifications(supabase, profile.organization_id)).filter((i) => !dismissed.has(i.id));
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

/** Max. aantal onthouden weggeklikte meldingen-id's per profiel -- een
 * melding die toch al buiten de top-20 van getRecentNotifications valt, hoeft
 * niet meer als "weggeklikt" onthouden te worden (die verschijnt daar sowieso
 * niet meer), dus dit hoeft niet onbeperkt te groeien. */
const MAX_DISMISSED_IDS = 200;

async function addDismissedIds(ids: string[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("dismissed_notification_ids")
    .eq("id", user.id)
    .single();
  if (!profile) return;

  const next = Array.from(new Set([...profile.dismissed_notification_ids, ...ids])).slice(-MAX_DISMISSED_IDS);
  await supabase.from("profiles").update({ dismissed_notification_ids: next }).eq("id", user.id);
}

/** Eén melding wegklikken -- verwijdert 'm niet echt (er is geen echte rij
 * voor, zie getRecentNotifications), maar onthoudt het id zodat 'ie voortaan
 * uit de lijst gefilterd wordt. */
export async function dismissNotification(notificationId: string) {
  await addDismissedIds([notificationId]);
}

/** "Alles wissen" -- de client geeft de id's van de nu getoonde meldingen
 * mee (die heeft 'ie toch al opgehaald), zodat hier geen extra query nodig
 * is om te bepalen wat er "nu" zichtbaar is. */
export async function clearAllNotifications(notificationIds: string[]) {
  await addDismissedIds(notificationIds);
}
