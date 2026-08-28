import { Eye, MousePointerClick, MessageCircle, Flame } from "lucide-react";
import type { QuoteEngagement } from "@/lib/stats/queries";
import type { BlockDraft } from "@/lib/blocks/types";
import { BLOCK_LABELS } from "@/lib/blocks/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

function blockLabel(blocks: BlockDraft[], blockId: string) {
  const block = blocks.find((b) => b.id === blockId);
  if (!block) return "Verwijderd blok";
  const content = block.content as Record<string, unknown>;
  const heading = typeof content.heading === "string" ? content.heading : null;
  return heading || BLOCK_LABELS[block.type];
}

export function EngagementCard({ engagement, blocks }: { engagement: QuoteEngagement; blocks: BlockDraft[] }) {
  const isWarm = engagement.totalViews >= 3 || engagement.optionChanges >= 2 || engagement.commentCount >= 1;
  const sectionEntries = Object.entries(engagement.sectionViewCounts).sort((a, b) => b[1] - a[1]);

  if (engagement.totalViews === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activiteit</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-ink-400">Nog niet bekeken door de klant.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Activiteit</CardTitle>
          {isWarm && (
            <span className="flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-semibold text-orange-700">
              <Flame className="size-3" /> Warme lead
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center gap-2.5 rounded-brand-sm bg-sand-100 px-3 py-2.5">
            <Eye className="size-4 text-blue-600" />
            <div>
              <p className="font-display text-lg font-semibold text-ink-500">{engagement.totalViews}</p>
              <p className="text-[11px] text-ink-400">keer bekeken</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-brand-sm bg-sand-100 px-3 py-2.5">
            <MousePointerClick className="size-4 text-teal-600" />
            <div>
              <p className="font-display text-lg font-semibold text-ink-500">{engagement.optionChanges}</p>
              <p className="text-[11px] text-ink-400">optiewijzigingen</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-brand-sm bg-sand-100 px-3 py-2.5">
            <MessageCircle className="size-4 text-orange-600" />
            <div>
              <p className="font-display text-lg font-semibold text-ink-500">{engagement.commentCount}</p>
              <p className="text-[11px] text-ink-400">reacties</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-ink-400">
          {engagement.firstViewedAt && <span>Eerst bekeken: {formatDate(engagement.firstViewedAt)}</span>}
          {engagement.lastViewedAt && <span>Laatst bekeken: {formatDate(engagement.lastViewedAt)}</span>}
        </div>

        {sectionEntries.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
              Meest bekeken onderdelen
            </p>
            <div className="flex flex-col gap-1.5">
              {sectionEntries.slice(0, 5).map(([blockId, count]) => (
                <div key={blockId} className="flex items-center justify-between text-sm">
                  <span className="text-ink-500">{blockLabel(blocks, blockId)}</span>
                  <span className="text-ink-400">{count}×</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
