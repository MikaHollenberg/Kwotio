"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { declineQuote } from "@/app/offerte/[token]/actions";
import { useTranslation } from "@/lib/i18n/language-context";
import { DECLINE_REASON_KEYS } from "@/lib/i18n/translations";

/**
 * Vervangt de eerdere kale ConfirmDialog bij "Afwijzen" -- legt nu ook vast
 * waarom, zodat het bureau (en de statistieken) meer hebben dan alleen de
 * status "geweigerd". Zelfde modal-shell/patroon als RequestChangesModal.
 */
export function DeclineQuoteModal({
  open,
  onClose,
  token,
  onDeclined,
}: {
  open: boolean;
  onClose: () => void;
  token: string;
  onDeclined: () => void;
}) {
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();
  const { t } = useTranslation();

  if (!open) return null;

  const isOther = reason === "decline_reason_other";
  const canSubmit = reason && (!isOther || note.trim());

  function handleClose() {
    setReason("");
    setNote("");
    setError(false);
    onClose();
  }

  function handleSubmit() {
    setError(false);
    startTransition(async () => {
      try {
        // reason is bewust de vertaal-KEY (bv. "decline_reason_too_expensive"),
        // geen vertaalde string -- het bureau-dashboard is altijd Nederlands
        // (zie QuotePreview) en vertaalt deze key zelf terug via `translate()`.
        await declineQuote(token, reason, note.trim() || null);
        onDeclined();
      } catch {
        setError(true);
      }
    });
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 flex items-end justify-center bg-ink-500/50 sm:items-center sm:p-6"
        onClick={handleClose}
      >
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-brand-lg bg-white p-6 shadow-2xl sm:rounded-brand-lg"
        >
          <div className="flex items-start justify-between">
            <h2 className="font-display text-xl font-semibold text-ink-500">{t("decline_confirm_title")}</h2>
            <button onClick={handleClose} className="flex size-8 items-center justify-center rounded-brand-sm text-ink-400 hover:bg-sand-200">
              <X className="size-4" />
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <p className="text-sm text-ink-400">{t("decline_confirm_description")}</p>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-ink-400">{t("decline_reason_label")}</span>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="h-11 rounded-brand-sm border border-ink-200 bg-white px-3.5 text-sm text-ink-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              >
                <option value="" disabled>
                  {t("decline_reason_placeholder")}
                </option>
                {DECLINE_REASON_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {t(key)}
                  </option>
                ))}
              </select>
            </label>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={isOther ? t("decline_note_placeholder_required") : t("decline_note_placeholder")}
              rows={3}
              className="min-h-20 resize-y rounded-brand-sm border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            />

            {error && <p className="text-sm text-red-600">{t("decline_error")}</p>}

            <Button variant="outline" disabled={!canSubmit || pending} onClick={handleSubmit} className="border-red-200 text-red-700 hover:bg-red-50">
              {pending ? "…" : t("decline_confirm_button")}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
