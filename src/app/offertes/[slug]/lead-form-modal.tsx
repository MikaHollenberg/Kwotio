"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { submitLead } from "./actions";
import { ClosedDatePicker } from "./closed-date-picker";

const inputClass =
  "h-10 rounded-brand-sm border border-ink-200 bg-white px-3 text-sm text-ink-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20";
const labelClass = "flex flex-col gap-1.5 text-xs font-semibold text-ink-400";

const PURPOSE_OPTIONS: { value: "uitje" | "arrangement" | "overig"; label: string }[] = [
  { value: "uitje", label: "Uitje" },
  { value: "arrangement", label: "Arrangement" },
  { value: "overig", label: "Overig" },
];

export function LeadFormModal({
  orgSlug,
  closedDates,
  closedWeekdays,
  accentColor,
  onClose,
}: {
  orgSlug: string;
  closedDates: string[];
  /** organizations.closed_weekdays -- 0 = zondag .. 6 = zaterdag. */
  closedWeekdays: number[];
  accentColor: string;
  onClose: () => void;
}) {
  const formStartedAt = useRef(0);
  useEffect(() => {
    formStartedAt.current = Date.now();
  }, []);
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [purpose, setPurpose] = useState<"uitje" | "arrangement" | "overig">("uitje");
  const [guestCount, setGuestCount] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    if (!name.trim()) {
      setError("Vul je naam in.");
      return;
    }
    if (!email.trim() || !phone.trim()) {
      setError("Vul zowel een e-mailadres als telefoonnummer in.");
      return;
    }
    if (!guestCount.trim() || Number(guestCount) <= 0) {
      setError("Vul een geschat aantal personen in.");
      return;
    }
    if (!preferredDate) {
      setError("Kies een voorkeursdatum.");
      return;
    }
    startTransition(async () => {
      const result = await submitLead({
        orgSlug,
        name,
        companyName,
        email,
        phone,
        purpose,
        guestCount,
        preferredDate,
        message,
        honeypot,
        formStartedAt: formStartedAt.current,
      });
      if (result.ok) setSuccess(true);
      else setError(result.error);
    });
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-500/50 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-md flex-col overflow-y-auto rounded-brand-lg bg-white p-6 shadow-2xl"
      >
        {success ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="size-10 text-emerald-500" />
            <h2 className="font-display text-lg font-semibold text-ink-500">Verstuurd</h2>
            <p className="text-sm text-ink-400">We hebben je gegevens ontvangen en nemen snel contact met je op.</p>
            <Button variant="outline" size="sm" onClick={onClose} className="mt-2">
              Sluiten
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-1 flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-semibold text-ink-500">Neem contact met mij op</h2>
                <p className="mt-1 text-xs text-ink-400">
                  Nog niet helemaal zeker waar je naar zoekt, of staat jouw ideale uitje er niet tussen? Neem dan
                  direct contact op -- in overleg is een hoop mogelijk!
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex size-8 shrink-0 items-center justify-center rounded-brand-sm text-ink-400 hover:bg-sand-200"
              >
                <X className="size-4" />
              </button>
            </div>

            <form
              className="mt-4 flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
            >
              {/* Honeypot — voor mensen onzichtbaar, bots vullen dit vaak toch in. */}
              <input
                type="text"
                name="website"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                aria-hidden="true"
              />

              <label className={labelClass}>
                Naam
                <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
              </label>
              <label className={labelClass}>
                Bedrijfsnaam (optioneel)
                <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputClass} />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className={labelClass}>
                  E-mail
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className={labelClass}>
                  Telefoon
                  <input required value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
                </label>
              </div>

              <div className={labelClass}>
                Waarvoor?
                <div className="flex gap-1.5">
                  {PURPOSE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPurpose(opt.value)}
                      style={opt.value === purpose ? { backgroundColor: accentColor, borderColor: accentColor } : undefined}
                      className={cn(
                        "flex-1 rounded-brand-sm border px-2 py-2 text-xs font-semibold transition-colors duration-200 ease-brand",
                        opt.value === purpose ? "text-white" : "border-ink-200 text-ink-400 hover:border-ink-300",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className={labelClass}>
                  Geschat aantal personen
                  <input
                    required
                    type="number"
                    min={1}
                    value={guestCount}
                    onChange={(e) => setGuestCount(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className={labelClass}>
                  Voorkeursdatum
                  <ClosedDatePicker
                    value={preferredDate}
                    onChange={setPreferredDate}
                    closedDates={closedDates}
                    closedWeekdays={closedWeekdays}
                  />
                </label>
              </div>

              <label className={labelClass}>
                Bericht (optioneel)
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Bijv. waar je ongeveer aan denkt, of wanneer."
                  className="w-full rounded-brand-sm border border-ink-200 bg-white px-3 py-2 text-sm text-ink-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
              </label>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <Button type="submit" disabled={pending} className="mt-1">
                {pending ? "Bezig met versturen…" : "Versturen"}
              </Button>
              <p className="text-center text-xs text-ink-300">
                Ter vergelijking: de volledige aanvraag vraagt ook nog een specifiek template.
              </p>
            </form>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
