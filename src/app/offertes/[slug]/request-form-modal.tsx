"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitQuoteRequest } from "./actions";

const inputClass =
  "h-10 rounded-brand-sm border border-ink-200 bg-white px-3 text-sm text-ink-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20";
const labelClass = "flex flex-col gap-1.5 text-xs font-semibold text-ink-400";

export function RequestFormModal({
  orgSlug,
  templates,
  initialTemplateId,
  guestCountFieldActive,
  guestCountFieldLabel,
  onClose,
}: {
  orgSlug: string;
  templates: { id: string; name: string }[];
  /** Al geopende template op het moment dat het formulier werd geopend —
   * wordt alvast geselecteerd, maar blijft een gewoon wijzigbaar veld. */
  initialTemplateId: string | null;
  guestCountFieldActive: boolean;
  guestCountFieldLabel: string;
  onClose: () => void;
}) {
  const formStartedAt = useRef(0);
  useEffect(() => {
    formStartedAt.current = Date.now();
  }, []);
  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState(initialTemplateId ?? "");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [desiredDate, setDesiredDate] = useState("");
  const [notes, setNotes] = useState("");
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
    if (!templateId) {
      setError("Kies een template.");
      return;
    }
    if (!email.trim() || !phone.trim()) {
      setError("Vul zowel een e-mailadres als telefoonnummer in.");
      return;
    }
    startTransition(async () => {
      const result = await submitQuoteRequest({
        orgSlug,
        templateId,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        customerCompany: company,
        guestCount,
        desiredDate,
        notes,
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
            <h2 className="font-display text-lg font-semibold text-ink-500">Aanvraag verstuurd</h2>
            <p className="text-sm text-ink-400">
              We hebben je aanvraag ontvangen en nemen snel contact met je op.
            </p>
            <Button variant="outline" size="sm" onClick={onClose} className="mt-2">
              Sluiten
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-ink-500">Vraag offerte aan</h2>
              <button
                type="button"
                onClick={onClose}
                className="flex size-8 items-center justify-center rounded-brand-sm text-ink-400 hover:bg-sand-200"
              >
                <X className="size-4" />
              </button>
            </div>

            <form
              className="flex flex-col gap-4"
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
                Template
                <select
                  required
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className={inputClass}
                >
                  <option value="" disabled>
                    Kies een template…
                  </option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
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
              <label className={labelClass}>
                Bedrijfsnaam (optioneel)
                <input value={company} onChange={(e) => setCompany(e.target.value)} className={inputClass} />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className={labelClass}>
                  Gewenste datum (optioneel)
                  <input
                    type="date"
                    value={desiredDate}
                    onChange={(e) => setDesiredDate(e.target.value)}
                    className={inputClass}
                  />
                </label>
                {guestCountFieldActive && (
                  <label className={labelClass}>
                    {guestCountFieldLabel}
                    <input
                      type="number"
                      min={0}
                      value={guestCount}
                      onChange={(e) => setGuestCount(e.target.value)}
                      className={inputClass}
                    />
                  </label>
                )}
              </div>
              <label className={labelClass}>
                Opmerkingen (optioneel)
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-brand-sm border border-ink-200 bg-white px-3 py-2 text-sm text-ink-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
              </label>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <Button type="submit" disabled={pending} className="mt-1">
                {pending ? "Bezig met versturen…" : "Aanvraag versturen"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
