"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Search, UserPlus, Check, ArrowLeft } from "lucide-react";
import { searchClients, createClientRecord } from "@/app/dashboard/klanten/actions";
import { cn } from "@/lib/utils";

export type SelectedClient = { id: string; name: string; email: string | null; companyName: string | null };

const inputClass =
  "h-10 w-full rounded-brand-sm border border-ink-200 bg-white px-3 text-sm text-ink-500 outline-none transition-colors duration-200 ease-brand placeholder:text-ink-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20";

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

  const [creatingNew, setCreatingNew] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, startCreateTransition] = useTransition();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setCreatingNew(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      startTransition(async () => {
        const rows = await searchClients(query);
        setResults(rows.map((r) => ({ id: r.id, name: r.name, email: r.email, companyName: r.company_name })));
      });
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  const exactMatch = results.some((r) => r.name.toLowerCase() === query.trim().toLowerCase());

  function handleCreate() {
    setCreateError(null);
    if (!newEmail.trim()) {
      setCreateError("E-mailadres is verplicht.");
      return;
    }
    startCreateTransition(async () => {
      try {
        const created = await createClientRecord({
          name: query.trim(),
          email: newEmail.trim(),
          companyName: newCompany.trim() || undefined,
        });
        onChange({ id: created.id, name: created.name, email: created.email, companyName: created.company_name });
        setQuery("");
        setNewEmail("");
        setNewCompany("");
        setCreatingNew(false);
        setOpen(false);
      } catch {
        setCreateError("Aanmaken mislukt. Probeer het opnieuw.");
      }
    });
  }

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
            setCreatingNew(false);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Zoek of typ een klantnaam…"
          className="h-11 w-full rounded-brand-sm border border-ink-200 bg-white pl-9 pr-3.5 text-sm text-ink-500 outline-none transition-colors duration-200 ease-brand placeholder:text-ink-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        />
      </div>

      {open && (query.length > 0 || results.length > 0) && (
        <div className="absolute left-0 top-full z-20 mt-1.5 w-full overflow-hidden rounded-brand-sm border border-ink-200 bg-white shadow-lg">
          {creatingNew ? (
            <div className="flex flex-col gap-3 p-3.5">
              <button
                type="button"
                onClick={() => setCreatingNew(false)}
                className="flex items-center gap-1.5 text-xs font-medium text-ink-400 hover:text-ink-500"
              >
                <ArrowLeft className="size-3.5" /> Terug naar zoeken
              </button>
              <p className="text-sm text-ink-500">
                Nieuwe klant <span className="font-semibold">&quot;{query.trim()}&quot;</span> aanmaken
              </p>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-ink-400">
                  E-mailadres <span className="text-red-500">*</span>
                </span>
                <input
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  type="email"
                  required
                  placeholder="naam@bedrijf.nl"
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-ink-400">Bedrijfsnaam (optioneel)</span>
                <input
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  className={inputClass}
                />
              </label>
              {createError && <p className="text-xs text-red-600">{createError}</p>}
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating || !newEmail.trim()}
                className="flex h-10 items-center justify-center rounded-brand-sm bg-teal-600 text-sm font-semibold text-white transition-colors duration-200 ease-brand hover:bg-teal-700 disabled:opacity-60"
              >
                {creating ? "Bezig…" : "Klant aanmaken"}
              </button>
            </div>
          ) : (
            <>
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
                    <span className="min-w-0">
                      <span className="font-medium text-ink-500">{client.name}</span>
                      {client.companyName && <span className="ml-2 text-xs text-ink-400">{client.companyName}</span>}
                      {client.email && <span className="ml-2 text-xs text-ink-400">{client.email}</span>}
                    </span>
                    {value?.id === client.id && <Check className="size-4 shrink-0 text-teal-600" />}
                  </button>
                ))}

              {!pending && query.trim().length > 1 && !exactMatch && (
                <button
                  type="button"
                  onClick={() => setCreatingNew(true)}
                  className={cn(
                    "flex w-full items-center gap-2 border-t border-ink-100 px-3.5 py-2.5 text-left text-sm font-medium text-teal-700 hover:bg-teal-50",
                  )}
                >
                  <UserPlus className="size-4" /> Nieuwe klant &quot;{query.trim()}&quot; aanmaken
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
