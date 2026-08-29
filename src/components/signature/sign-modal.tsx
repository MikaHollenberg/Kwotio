"use client";

import { useRef, useState, useTransition } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SignaturePad, type SignaturePadHandle } from "./signature-pad";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { PriceDisplayMode } from "@/lib/types/database";
import { signQuote, type SignQuoteInput } from "@/app/offerte/[token]/sign-action";
import { useTranslation } from "@/lib/i18n/language-context";

export function SignModal({
  open,
  onClose,
  onSigned,
  token,
  quoteTitle,
  selectedPackageName,
  total,
  currency,
  priceDisplay,
  pricePerPerson,
  selections,
  organizationName,
  termsUrl,
  headcountRequired,
  headcountNote,
}: {
  open: boolean;
  onClose: () => void;
  onSigned: (signerName: string) => void;
  token: string;
  quoteTitle: string;
  selectedPackageName: string | null;
  total: number;
  currency: string;
  priceDisplay: PriceDisplayMode;
  pricePerPerson: boolean;
  selections: SignQuoteInput["selections"];
  organizationName: string;
  termsUrl: string | null;
  headcountRequired: boolean;
  headcountNote: string | null;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [headcount, setHeadcount] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const sigRef = useRef<SignaturePadHandle>(null);
  const { t } = useTranslation();

  if (!open) return null;

  const canSubmit = name.trim() && email.trim() && agreed && (!headcountRequired || headcount.trim());

  function handleSubmit() {
    setError(null);
    if (sigRef.current?.isEmpty() ?? true) {
      setError(t("sign_error_generic"));
      return;
    }

    startTransition(async () => {
      const result = await signQuote(token, {
        signerName: name.trim(),
        signerEmail: email.trim(),
        signatureDataUrl: sigRef.current!.toDataUrl(),
        selections,
        aantalPersonen: headcount.trim() ? Number(headcount) : null,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }
      onSigned(name.trim());
    });
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 flex items-end justify-center bg-ink-500/50 sm:items-center sm:p-6"
        onClick={onClose}
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
            <div>
              <h2 className="font-display text-xl font-semibold text-ink-500">{t("sign_modal_title")}</h2>
              <p className="mt-1 text-sm text-ink-400">{quoteTitle}</p>
            </div>
            <button onClick={onClose} className="flex size-8 items-center justify-center rounded-brand-sm text-ink-400 hover:bg-sand-200">
              <X className="size-4" />
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-brand-sm bg-sand-100 px-4 py-3">
            <div>
              <p className="text-xs text-ink-400">{selectedPackageName ?? ""}</p>
              <p className="font-display text-lg font-semibold text-ink-500">
                {formatCurrency(total, currency)}
                {pricePerPerson ? " p.p." : ""}{" "}
                <span className="text-xs font-normal text-ink-400">
                  ({t(priceDisplay === "incl_btw" ? "price_incl_btw" : "price_excl_btw")})
                </span>
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("full_name")}
                className="h-11 rounded-brand-sm border border-ink-200 bg-white px-3.5 text-sm text-ink-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder={t("email_address")}
                className="h-11 rounded-brand-sm border border-ink-200 bg-white px-3.5 text-sm text-ink-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            {headcountRequired && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-ink-500">
                  {t("headcount_label")} <span className="text-red-500">*</span>
                </label>
                <input
                  value={headcount}
                  onChange={(e) => setHeadcount(e.target.value)}
                  type="number"
                  min={1}
                  required
                  placeholder={t("headcount_placeholder")}
                  className="h-11 rounded-brand-sm border border-ink-200 bg-white px-3.5 text-sm text-ink-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
                {headcountNote && <p className="text-[11px] text-ink-400">{headcountNote}</p>}
              </div>
            )}

            <SignaturePad ref={sigRef} />

            <label className="flex items-start gap-2.5 rounded-brand-sm border border-yellow-300 bg-yellow-50 px-3.5 py-3 text-xs text-ink-500">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 size-4 shrink-0 accent-teal-600"
              />
              <span>
                {termsUrl ? (
                  <>
                    {t("agree_prefix")}{" "}
                    <a
                      href={termsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="font-semibold text-teal-700 underline hover:text-teal-800"
                    >
                      {t("terms_link")}
                    </a>{" "}
                    {t("agree_suffix", { org: organizationName })}
                  </>
                ) : (
                  t("agree_no_terms")
                )}
              </span>
            </label>

            {error && <p className="rounded-brand-sm bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</p>}

            <Button disabled={!canSubmit || pending} onClick={handleSubmit} className="mt-1">
              {pending ? t("signing_in_progress") : t("confirm_and_sign")}
            </Button>
            <p className="text-center text-[11px] text-ink-300">{t("audit_note")}</p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
