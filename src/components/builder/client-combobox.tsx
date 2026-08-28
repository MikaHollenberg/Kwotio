"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Search, UserPlus, Check } from "lucide-react";
import { searchClients, createClientRecord } from "@/app/dashboard/klanten/actions";
import { cn } from "@/lib/utils";

export type SelectedClient = { id: string; name: string; email: string | null };

export function ClientCombobox({
  value,
  onChange,
}: {
  value: SelectedClient | null;
  onChange: (client: SelectedClient) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SelectedClient[]>([]);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      startTransition(async () => {
        const rows = await searchClients(query);
        setResults(rows);
      });
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  const exactMatch = results.some((r) => r.name.toLowerCase() === query.trim().toLowerCase());

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-300" />
        <input
          value={value ? value.name : query}
          onChange={(e) => {
            onChange(null as unknown as SelectedClient);
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Zoek of typ een klantnaam…"
          className="h-11 w-full rounded-brand-sm border border-ink-200 bg-white pl-9 pr-3.5 text-sm text-ink-500 outline-none transition-colors duration-200 ease-brand placeholder:text-ink-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        />
      </div>

      {open && (query.length > 0 || results.length > 0) && (
        <div className="absolute left-0 top-full z-20 mt-1.5 w-full overflow-hidden rounded-brand-sm border border-ink-200 bg-white shadow-lg">
          {pending && <div className="px-3.5 py-2.5 text-xs text-ink-400">Zoeken…</div>}

          {!pending &&
            results.map((client) => (
              <button
                key={client.id}
                type="button"
                onClick={() => {
                  onChange(client);
                  setQuery("");
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-sm hover:bg-sand-100"
              >
                <span>
                  <span className="font-medium text-ink-500">{client.name}</span>
                  {client.email && <span className="ml-2 text-xs text-ink-400">{client.email}</span>}
                </span>
                {value?.id === client.id && <Check className="size-4 text-teal-600" />}
              </button>
            ))}

          {!pending && query.trim().length > 1 && !exactMatch && (
            <button
              type="button"
              onClick={() => {
                startTransition(async () => {
                  const created = await createClientRecord({ name: query.trim() });
                  onChange(created);
                  setQuery("");
                  setOpen(false);
                });
              }}
              className={cn(
                "flex w-full items-center gap-2 border-t border-ink-100 px-3.5 py-2.5 text-left text-sm font-medium text-teal-700 hover:bg-teal-50",
              )}
            >
              <UserPlus className="size-4" /> Nieuwe klant &quot;{query.trim()}&quot; aanmaken
            </button>
          )}
        </div>
      )}
    </div>
  );
}
