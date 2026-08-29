"use client";

import { useState, useTransition } from "react";
import { X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { submitComment } from "@/app/offerte/[token]/actions";
import { useTranslation } from "@/lib/i18n/language-context";

/**
 * Algemeen wijzigingsverzoek voor de hele offerte (i.p.v. per onderdeel) —
 * hergebruikt dezelfde opslag als de bestaande per-blok reactiefunctie
 * (submitComment met blockId: null), die al automatisch de status op
 * "in overleg" zet en het bureau meldt.
 */
export function RequestChangesModal({
  open,
  onClose,
  token,
}: {
  open: boolean;
  onClose: () => void;
  token: string;
}) {
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();
  const { t } = useTranslation();

  if (!open) return null;

  const canSubmit = name.trim() && body.trim();

  function handleClose() {
    setName("");
    setBody("");
    setSent(false);
    onClose();
  }

  function handleSubmit() {
    startTransition(async () => {
      await submitComment(token, { blockId: null, authorName: name.trim(), body: body.trim() });
      setSent(true);
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
            <h2 className="font-display text-xl font-semibold text-ink-500">{t("request_changes")}</h2>
            <button onClick={handleClose} className="flex size-8 items-center justify-center rounded-brand-sm text-ink-400 hover:bg-sand-200">
              <X className="size-4" />
            </button>
          </div>

          {sent ? (
            <div className="mt-6 flex flex-col items-center gap-3 py-4 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                <Check className="size-6" />
              </div>
              <p className="font-display text-lg font-semibold text-ink-500">{t("request_changes_sent_title")}</p>
              <p className="text-sm text-ink-400">{t("request_changes_sent_body")}</p>
              <Button onClick={handleClose} className="mt-2">
                {t("close")}
              </Button>
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              <p className="text-sm text-ink-400">{t("request_changes_intro")}</p>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("full_name")}
                className="h-11 rounded-brand-sm border border-ink-200 bg-white px-3.5 text-sm text-ink-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={t("request_changes_placeholder")}
                rows={4}
                className="min-h-28 resize-y rounded-brand-sm border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
              <Button disabled={!canSubmit || pending} onClick={handleSubmit}>
                {pending ? t("request_changes_sending") : t("request_changes_submit")}
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
