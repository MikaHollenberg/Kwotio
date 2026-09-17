"use client";

import { useState, useTransition, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Send, CircleCheck, Link2, FileStack, X } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { InvoiceStatus, InvoiceType, InvoicePaymentMethod } from "@/lib/types/database";
import { MANUAL_PAYMENT_METHODS, INVOICE_PAYMENT_METHOD_LABELS } from "@/lib/invoicing/status";
import { sendInvoice, markInvoicePaid, createMolliePaymentLink, createCreditNote } from "../actions";

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function InvoiceActionsBar({
  invoiceId,
  status,
  type,
  hasMollieKey,
  hasSlotfactuur,
  hasCreditNote,
}: {
  invoiceId: string;
  status: InvoiceStatus;
  type: InvoiceType;
  hasMollieKey: boolean;
  /** Alleen relevant voor type === "aanbetaling": is er al een slotfactuur
   * voor deze aanbetaling aangemaakt? Zo ja, geen knop meer tonen. */
  hasSlotfactuur: boolean;
  /** Is er al een creditnota voor deze factuur aangemaakt? Zo ja, geen knop
   * meer tonen (één creditnota per factuur, zie `createCreditNote`). */
  hasCreditNote: boolean;
}) {
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendPending, startSendTransition] = useTransition();

  const [markPaidOpen, setMarkPaidOpen] = useState(false);
  const [paidDate, setPaidDate] = useState(todayKey());
  const [method, setMethod] = useState<Exclude<InvoicePaymentMethod, "mollie">>("overboeking");
  const [note, setNote] = useState("");
  const [paidError, setPaidError] = useState<string | null>(null);
  const [paidPending, startPaidTransition] = useTransition();
  const [justPaid, setJustPaid] = useState(false);
  // Munten-burst als eigen beloningsmomentje bij "betaald" (Kwotio Motion
  // Concepts #13) -- de willekeurige hoek/afstand per deeltje wordt bewust
  // in de event-handler zelf bepaald (handleMarkPaid), niet tijdens render
  // (useMemo/render moeten puur blijven -- Math.random() daar zou bij elke
  // re-render een andere burst opleveren).
  const [coinParticles, setCoinParticles] = useState<{ id: number; dx: number; dy: number }[]>([]);

  const [mollieUrl, setMollieUrl] = useState<string | null>(null);
  const [mollieError, setMollieError] = useState<string | null>(null);
  const [molliePending, startMollieTransition] = useTransition();
  const [mollieCopied, setMollieCopied] = useState(false);
  const [showMollieFallback, setShowMollieFallback] = useState(false);

  function handleSend() {
    setSendError(null);
    startSendTransition(async () => {
      try {
        await sendInvoice(invoiceId);
      } catch (err) {
        setSendError(err instanceof Error ? err.message : "Versturen mislukt.");
      }
    });
  }

  function handleCreateMollieLink() {
    setMollieError(null);
    startMollieTransition(async () => {
      try {
        const url = await createMolliePaymentLink(invoiceId);
        setMollieUrl(url);
        try {
          await navigator.clipboard.writeText(url);
          setMollieCopied(true);
          setTimeout(() => setMollieCopied(false), 2000);
        } catch {
          // Clipboard-write geweigerd (bv. geen HTTPS/restrictieve
          // instellingen) -- zichtbare fallback i.p.v. stilzwijgend niets
          // doen, zelfde patroon als de embed-code-kopieerknop elders.
          setShowMollieFallback(true);
        }
      } catch (err) {
        setMollieError(err instanceof Error ? err.message : "Aanmaken mislukt.");
      }
    });
  }

  function handleMarkPaid() {
    setPaidError(null);
    startPaidTransition(async () => {
      try {
        await markInvoicePaid(invoiceId, { paidDate, note, method });
        setMarkPaidOpen(false);
        setCoinParticles(
          Array.from({ length: 12 }, (_, i) => {
            const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.4;
            const dist = 70 + Math.random() * 60;
            return { id: i, dx: Math.cos(angle) * dist, dy: Math.sin(angle) * dist - 20 };
          }),
        );
        setJustPaid(true);
        setTimeout(() => setJustPaid(false), 1000);
      } catch (err) {
        setPaidError(err instanceof Error ? err.message : "Opslaan mislukt.");
      }
    });
  }

  // Geen try/catch omheen createCreditNote: die redirect zelf naar de
  // nieuwe factuur bij succes (zelfde reden als elders in dit project).
  // "Maak slotfactuur" is een link naar een eigen pagina (vanaf 0 de
  // definitieve regels invullen), geen directe server-actie hier.
  const showSlotfactuurButton = type === "aanbetaling" && status === "betaald" && !hasSlotfactuur;

  const [creditPending, startCreditTransition] = useTransition();
  const showCreditNoteButton =
    type !== "creditnota" && status !== "concept" && status !== "geannuleerd" && !hasCreditNote;

  const canMarkPaid = status === "concept" || status === "open" || status === "deels_betaald" || status === "vervallen";

  const coinBurst =
    justPaid &&
    typeof document !== "undefined" &&
    createPortal(
      <div aria-hidden className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
        {coinParticles.map((p) => (
          <span
            key={p.id}
            className="kw-coin-burst absolute size-3 rounded-full bg-yellow-500"
            style={{ "--kw-dx": `${p.dx}px`, "--kw-dy": `${p.dy}px` } as CSSProperties}
          />
        ))}
      </div>,
      document.body,
    );

  if (status === "betaald" && !showSlotfactuurButton && !showCreditNoteButton) return coinBurst || null;
  if (status === "geannuleerd") return null;

  return (
    <div className="flex flex-col items-end gap-1">
      {coinBurst}
      <div className="flex items-center gap-2">
        {status === "concept" && (
          <Button type="button" variant="primary" size="sm" onClick={handleSend} disabled={sendPending}>
            <Send className="mr-1.5 size-4" />
            {sendPending ? "Bezig…" : "Verstuur factuur"}
          </Button>
        )}
        {canMarkPaid && (
          <Button type="button" variant="outline" size="sm" onClick={() => setMarkPaidOpen(true)}>
            <CircleCheck className="mr-1.5 size-4" />
            Markeer als betaald
          </Button>
        )}
        {hasMollieKey && canMarkPaid && (
          <Button type="button" variant="ghost" size="sm" onClick={handleCreateMollieLink} disabled={molliePending}>
            <Link2 className="mr-1.5 size-4" />
            {molliePending ? "Bezig…" : "Mollie-betaallink"}
          </Button>
        )}
        {showSlotfactuurButton && (
          <ButtonLink href={`/dashboard/facturen/${invoiceId}/slotfactuur`} variant="primary" size="sm">
            <FileStack className="mr-1.5 size-4" />
            Maak slotfactuur
          </ButtonLink>
        )}
        {showCreditNoteButton && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => startCreditTransition(() => createCreditNote(invoiceId))}
            disabled={creditPending}
            title="Voor een foutieve, al verstuurde factuur -- crediteert de volledige factuur"
          >
            <FileStack className="mr-1.5 size-4" />
            {creditPending ? "Bezig…" : "Maak creditnota"}
          </Button>
        )}
      </div>
      {type === "aanbetaling" && status !== "betaald" && !hasSlotfactuur && (
        <p className="max-w-xs text-right text-xs text-ink-400">
          Zodra deze aanbetaling is gemarkeerd als betaald, verschijnt hier de knop om de slotfactuur te maken.
        </p>
      )}
      {sendError && <p className="text-xs text-red-600">{sendError}</p>}
      {mollieError && <p className="text-xs text-red-600">{mollieError}</p>}
      {mollieUrl && (
        <div className="max-w-xs text-right">
          <p className="text-xs text-teal-700">{mollieCopied ? "Link gekopieerd naar klembord" : "Betaallink aangemaakt"}</p>
          {showMollieFallback && (
            <textarea
              readOnly
              value={mollieUrl}
              onFocus={(e) => e.currentTarget.select()}
              className="mt-1 h-16 w-64 rounded-brand-sm border border-ink-200 bg-white p-2 text-xs text-ink-500"
            />
          )}
        </div>
      )}

      {markPaidOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink-500/50 p-4"
            onClick={() => !paidPending && setMarkPaidOpen(false)}
          >
            <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-brand-lg bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between">
                <h2 className="font-display text-lg font-semibold text-ink-500">Markeer als betaald</h2>
                <button
                  onClick={() => setMarkPaidOpen(false)}
                  disabled={paidPending}
                  className="flex size-8 items-center justify-center rounded-brand-sm text-ink-400 hover:bg-sand-200"
                >
                  <X className="size-4" />
                </button>
              </div>
              <p className="mt-2 text-sm text-ink-400">
                Voor een handmatige (bank)overboeking -- markeer dit los van een eventuele Mollie-betaallink.
              </p>

              <div className="mt-4 flex flex-col gap-3">
                <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-400">
                  Betaaldatum
                  <input
                    type="date"
                    value={paidDate}
                    onChange={(e) => setPaidDate(e.target.value)}
                    className="h-10 rounded-brand-sm border border-ink-200 bg-white px-3 text-sm text-ink-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  />
                </label>
                <div className="flex flex-col gap-1.5 text-xs font-semibold text-ink-400">
                  Betaalmethode
                  <div className="grid grid-cols-3 gap-1.5">
                    {MANUAL_PAYMENT_METHODS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMethod(m)}
                        className={cn(
                          "rounded-brand-sm border px-2 py-1.5 text-sm font-medium transition-colors duration-200 ease-brand",
                          method === m
                            ? "border-teal-500 bg-teal-500 text-white"
                            : "border-ink-200 text-ink-500 hover:border-ink-300",
                        )}
                      >
                        {INVOICE_PAYMENT_METHOD_LABELS[m]}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-400">
                  Notitie (optioneel)
                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="bijv. overgemaakt via bank"
                    className="h-10 rounded-brand-sm border border-ink-200 bg-white px-3 text-sm text-ink-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  />
                </label>
                {paidError && <p className="text-sm text-red-600">{paidError}</p>}
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setMarkPaidOpen(false)} disabled={paidPending}>
                  Annuleren
                </Button>
                <Button variant="primary" size="sm" onClick={handleMarkPaid} disabled={paidPending}>
                  {paidPending ? "Bezig…" : "Markeer als betaald"}
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
