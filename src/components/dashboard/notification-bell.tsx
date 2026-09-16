"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Bell, MessageCircle, ThumbsDown, CheckCircle2, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { getNotifications, markNotificationsSeen, type NotificationsData } from "@/app/dashboard/notifications-actions";
import type { NotificationItem } from "@/lib/notifications/queries";

const POLL_INTERVAL_MS = 45_000;
const PANEL_WIDTH = 320;

const ICONS: Record<NotificationItem["type"], typeof MessageCircle> = {
  comment: MessageCircle,
  declined: ThumbsDown,
  signed: CheckCircle2,
  quote_request: Inbox,
};

const ICON_TONE: Record<NotificationItem["type"], string> = {
  comment: "bg-teal-100 text-teal-800",
  declined: "bg-red-50 text-red-700",
  signed: "bg-emerald-50 text-emerald-700",
  quote_request: "bg-blue-100 text-blue-800",
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "zojuist";
  if (mins < 60) return `${mins}m geleden`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}u geleden`;
  return `${Math.round(hours / 24)}d geleden`;
}

export function NotificationBell() {
  const [data, setData] = useState<NotificationsData | null>(null);
  const [open, setOpen] = useState(false);
  const [panelPos, setPanelPos] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    function refresh() {
      getNotifications().then((next) => {
        if (!cancelled) setData(next);
      });
    }
    refresh();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Portal naar document.body (zie ConfirmDialog/MobileNav) -- de Topbar
  // heeft backdrop-blur, wat een eigen stacking-context maakt en een
  // position:absolute paneel hierbinnen achter latere paginacontent zoals
  // Cards laat wegzakken i.p.v. erboven te liggen. Positie wordt daarom zelf
  // berekend (fixed, gebaseerd op de knop) i.p.v. relatief aan een voorouder.
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    }
    function handleDismiss() {
      setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    window.addEventListener("scroll", handleDismiss, true);
    window.addEventListener("resize", handleDismiss);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      window.removeEventListener("scroll", handleDismiss, true);
      window.removeEventListener("resize", handleDismiss);
    };
  }, [open]);

  function toggleOpen() {
    setOpen((v) => {
      const next = !v;
      if (next) {
        const rect = buttonRef.current?.getBoundingClientRect();
        if (rect) {
          setPanelPos({ top: rect.bottom + 8, right: Math.max(8, window.innerWidth - rect.right) });
        }
        if (data && data.unreadCount > 0) {
          void markNotificationsSeen();
          setData({ ...data, unreadCount: 0 });
        }
      }
      return next;
    });
  }

  const unreadCount = data?.unreadCount ?? 0;
  const seenAt = data?.seenAt ?? new Date().toISOString();

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleOpen}
        title="Meldingen"
        className={cn(
          "relative flex size-9 items-center justify-center rounded-brand-sm text-ink-400 hover:bg-sand-200 hover:text-ink-500",
          open && "bg-sand-200 text-ink-500",
        )}
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open &&
        createPortal(
          <div
            ref={panelRef}
            style={{ position: "fixed", top: panelPos.top, right: panelPos.right, width: PANEL_WIDTH }}
            className="z-50 max-w-[90vw] rounded-brand-sm border border-ink-200 bg-white shadow-lg"
          >
            <div className="border-b border-ink-100 px-4 py-2.5">
              <p className="text-sm font-semibold text-ink-500">Meldingen</p>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {!data ? (
                <p className="px-4 py-6 text-center text-sm text-ink-400">Bezig met laden…</p>
              ) : data.items.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-ink-400">Nog geen meldingen.</p>
              ) : (
                data.items.map((item) => {
                  const Icon = ICONS[item.type];
                  const isUnread = item.createdAt > seenAt;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="flex gap-3 border-b border-sand-200 px-4 py-3 last:border-b-0 hover:bg-sand-100"
                    >
                      <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-brand-sm", ICON_TONE[item.type])}>
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline gap-1.5">
                          <span className={cn("text-sm text-ink-500", isUnread ? "font-bold" : "font-medium")}>{item.title}</span>
                          {isUnread && <span className="size-1.5 shrink-0 rounded-full bg-orange-500" />}
                        </span>
                        <span className="line-clamp-2 block text-xs text-ink-400">{item.detail}</span>
                        <span className="text-[11px] text-ink-300">{timeAgo(item.createdAt)}</span>
                      </span>
                    </Link>
                  );
                })
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
