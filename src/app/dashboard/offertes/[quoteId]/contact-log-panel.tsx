"use client";

import { useState, useTransition } from "react";
import { PhoneCall, Trash2 } from "lucide-react";
import type { Database } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { addContactLog, deleteContactLog } from "@/app/dashboard/offertes/actions";

type ContactLog = Database["public"]["Tables"]["quote_contact_logs"]["Row"];

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "zojuist";
  if (mins < 60) return `${mins}m geleden`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}u geleden`;
  return `${Math.round(hours / 24)}d geleden`;
}

/**
 * Losse contactmomenten loggen (bv. "gebeld op 14 sept, klant belt na het
 * weekend terug") -- append-only, puur voor eigen opvolging. Geen bewerken
 * achteraf, alleen toevoegen/verwijderen, zelfde filosofie als
 * activity_events elders in dit project.
 */
export function ContactLogPanel({ quoteId, logs }: { quoteId: string; logs: ContactLog[] }) {
  const [items, setItems] = useState(logs);
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const sorted = [...items].sort((a, b) => b.created_at.localeCompare(a.created_at));

  return (
    <div className="flex flex-col gap-3 border-t border-ink-100 pt-4">
      <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-400">
        <PhoneCall className="size-3.5" /> Contactmomenten
      </span>

      {sorted.length > 0 && (
        <div className="flex flex-col gap-2">
          {sorted.map((log) => (
            <div key={log.id} className="flex items-start justify-between gap-3 rounded-brand-sm bg-sand-100 px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm text-ink-500">{log.body}</p>
                <p className="text-[11px] text-ink-300">
                  {log.author_name} · {timeAgo(log.created_at)}
                </p>
              </div>
              <button
                type="button"
                disabled={pending && deletingId === log.id}
                onClick={() => {
                  setDeletingId(log.id);
                  startTransition(async () => {
                    await deleteContactLog(log.id, quoteId);
                    setItems((prev) => prev.filter((l) => l.id !== log.id));
                  });
                }}
                className="shrink-0 text-ink-300 hover:text-red-600"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const body = draft.trim();
          if (!body) return;
          startTransition(async () => {
            await addContactLog(quoteId, body);
            setItems((prev) => [
              ...prev,
              { id: crypto.randomUUID(), quote_id: quoteId, author_name: "Jij", body, created_at: new Date().toISOString() },
            ]);
            setDraft("");
          });
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="bijv. Gebeld op 14 sept, klant belt na het weekend terug"
          className="h-9 flex-1 rounded-brand-sm border border-ink-200 bg-white px-3 text-sm text-ink-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        />
        <Button type="submit" variant="outline" size="sm" disabled={pending || !draft.trim()}>
          Toevoegen
        </Button>
      </form>
    </div>
  );
}
