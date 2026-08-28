"use client";

import { useState, useTransition } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/language-context";

export type CommentItem = {
  id: string;
  authorType: "client" | "agency";
  authorName: string;
  body: string;
  createdAt: string;
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

export function CommentThread({
  comments,
  onSubmit,
  defaultName = "",
  requireName = true,
}: {
  comments: CommentItem[];
  onSubmit: (input: { authorName: string; body: string }) => Promise<void>;
  defaultName?: string;
  requireName?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(defaultName);
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const { t } = useTranslation();

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-700"
      >
        {open ? <X className="size-3.5" /> : <MessageCircle className="size-3.5" />}
        {open
          ? t("close")
          : comments.length > 0
            ? `${comments.length} ${comments.length === 1 ? t("comment_count") : t("comments_count")}`
            : t("ask_question")}
      </button>

      {open && (
        <div className="mt-3 flex flex-col gap-3 rounded-brand-sm border border-ink-100 bg-sand-50 p-4">
          {comments.length > 0 && (
            <div className="flex flex-col gap-3">
              {comments.map((c) => (
                <div key={c.id} className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        c.authorType === "agency" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700",
                      )}
                    >
                      {c.authorType === "agency" ? t("agency_name") : c.authorName}
                    </span>
                    <span className="text-[11px] text-ink-300">{timeAgo(c.createdAt)}</span>
                  </div>
                  <p className="text-sm text-ink-500">{c.body}</p>
                </div>
              ))}
            </div>
          )}

          <form
            className="flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!body.trim() || (requireName && !name.trim())) return;
              startTransition(async () => {
                await onSubmit({ authorName: name.trim(), body: body.trim() });
                setBody("");
              });
            }}
          >
            {requireName && (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("your_name")}
                className="h-9 rounded-brand-sm border border-ink-200 bg-white px-3 text-sm text-ink-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
            )}
            <div className="flex items-end gap-2">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={t("comment_placeholder")}
                rows={2}
                className="min-h-[42px] flex-1 resize-y rounded-brand-sm border border-ink-200 bg-white px-3 py-2 text-sm text-ink-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
              <button
                type="submit"
                disabled={pending || !body.trim()}
                className="flex size-9 shrink-0 items-center justify-center rounded-brand-sm bg-teal-600 text-white transition-colors duration-200 ease-brand hover:bg-teal-700 disabled:opacity-50"
              >
                <Send className="size-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
