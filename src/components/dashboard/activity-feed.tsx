import { Eye, MousePointerClick, MessageCircle, PenLine, Send, ScrollText, ThumbsDown } from "lucide-react";
import type { ActivityEventType } from "@/lib/types/database";
import type { RecentActivityItem } from "@/lib/stats/queries";

const ACTIVITY_CONFIG: Record<ActivityEventType, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  sent: { label: "verzonden", icon: Send },
  viewed: { label: "bekeken", icon: Eye },
  section_viewed: { label: "sectie bekeken", icon: ScrollText },
  option_changed: { label: "optie aangepast", icon: MousePointerClick },
  comment_added: { label: "reactie geplaatst", icon: MessageCircle },
  signed: { label: "ondertekend", icon: PenLine },
  reminder_sent: { label: "herinnering verzonden", icon: Send },
  downloaded_pdf: { label: "PDF gedownload", icon: ScrollText },
  event_reminder_sent: { label: "evenement-herinnering verzonden", icon: Send },
  declined: { label: "afgewezen", icon: ThumbsDown },
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

export function ActivityFeed({ items }: { items: RecentActivityItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-ink-400">Nog geen activiteit.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => {
        const config = ACTIVITY_CONFIG[item.type];
        const Icon = config.icon;
        return (
          <a
            key={item.id}
            href={`/dashboard/offertes/${item.quoteId}`}
            className="flex items-center gap-3 rounded-brand-sm px-2 py-1.5 -mx-2 hover:bg-sand-100"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Icon className="size-3.5" />
            </div>
            <p className="flex-1 text-sm text-ink-500">
              <span className="font-medium">{item.quoteTitle}</span>{" "}
              <span className="text-ink-400">— {config.label}</span>
            </p>
            <span className="shrink-0 text-xs text-ink-300">{timeAgo(item.createdAt)}</span>
          </a>
        );
      })}
    </div>
  );
}
