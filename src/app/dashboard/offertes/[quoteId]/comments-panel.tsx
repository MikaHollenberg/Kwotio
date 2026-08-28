"use client";

import { useState, useTransition } from "react";
import { MessageCircle, Send } from "lucide-react";
import type { Database } from "@/lib/types/database";
import type { BlockDraft } from "@/lib/blocks/types";
import { BLOCK_LABELS } from "@/lib/blocks/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { replyToComment } from "@/app/dashboard/offertes/actions";

type Comment = Database["public"]["Tables"]["comments"]["Row"];

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "zojuist";
  if (mins < 60) return `${mins}m geleden`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}u geleden`;
  return `${Math.round(hours / 24)}d geleden`;
}

export function CommentsPanel({
  quoteId,
  comments,
  blocks,
}: {
  quoteId: string;
  comments: Comment[];
  blocks: BlockDraft[];
}) {
  const [items, setItems] = useState(comments);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  if (items.length === 0) return null;

  const grouped = new Map<string | "algemeen", Comment[]>();
  for (const c of items) {
    const key = c.block_id ?? "algemeen";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(c);
  }

  function blockLabel(blockId: string) {
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return "Verwijderd blok";
    const content = block.content as Record<string, unknown>;
    const heading = typeof content.heading === "string" ? content.heading : null;
    return heading || BLOCK_LABELS[block.type];
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageCircle className="size-4 text-teal-600" />
          <CardTitle>Reacties van de klant</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {[...grouped.entries()].map(([blockId, group]) => (
          <div key={blockId} className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
              {blockId === "algemeen" ? "Algemeen" : blockLabel(blockId)}
            </p>
            <div className="flex flex-col gap-2.5">
              {group.map((c) => (
                <div key={c.id} className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        c.author_type === "agency" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700",
                      )}
                    >
                      {c.author_name}
                    </span>
                    <span className="text-[11px] text-ink-300">{timeAgo(c.created_at)}</span>
                  </div>
                  <p className="text-sm text-ink-500">{c.body}</p>
                </div>
              ))}
            </div>
            <form
              className="flex items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const body = (replyDrafts[blockId] ?? "").trim();
                if (!body) return;
                const realBlockId = blockId === "algemeen" ? null : blockId;
                startTransition(async () => {
                  await replyToComment(quoteId, realBlockId, body);
                  setItems((prev) => [
                    ...prev,
                    {
                      id: crypto.randomUUID(),
                      quote_id: quoteId,
                      block_id: realBlockId,
                      author_type: "agency",
                      author_name: "Jij",
                      author_user_id: null,
                      body,
                      resolved: false,
                      created_at: new Date().toISOString(),
                    },
                  ]);
                  setReplyDrafts((prev) => ({ ...prev, [blockId]: "" }));
                });
              }}
            >
              <textarea
                value={replyDrafts[blockId] ?? ""}
                onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [blockId]: e.target.value }))}
                placeholder="Reageer op de klant…"
                rows={1}
                className="min-h-9 flex-1 resize-y rounded-brand-sm border border-ink-200 bg-white px-3 py-2 text-sm text-ink-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
              <button
                type="submit"
                disabled={pending}
                className="flex size-9 shrink-0 items-center justify-center rounded-brand-sm bg-teal-600 text-white transition-colors duration-200 ease-brand hover:bg-teal-700 disabled:opacity-50"
              >
                <Send className="size-4" />
              </button>
            </form>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
