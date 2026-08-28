"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { SunWatermark } from "@/components/brand/sun-watermark";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/language-context";

const CONFETTI_COLORS = ["#CC7A3E", "#E9C04E", "#2991B4", "#5890B1"];

function ConfettiPiece({ index }: { index: number }) {
  const left = (index * 37) % 100;
  const delay = (index % 10) * 0.06;
  const duration = 2.2 + (index % 5) * 0.3;
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const size = 6 + (index % 4) * 2;
  const rotateStart = (index * 53) % 360;

  return (
    <motion.span
      initial={{ y: -40, x: 0, opacity: 1, rotate: rotateStart }}
      animate={{ y: "100vh", x: (index % 2 === 0 ? 1 : -1) * (20 + (index % 6) * 8), opacity: [1, 1, 0], rotate: rotateStart + 260 }}
      transition={{ duration, delay, ease: "easeIn" }}
      style={{
        position: "absolute",
        left: `${left}%`,
        top: 0,
        width: size,
        height: size * 1.6,
        backgroundColor: color,
        borderRadius: 2,
      }}
    />
  );
}

export function SuccessCelebration({
  signerName,
  onClose,
  certificateHref,
}: {
  signerName: string;
  onClose: () => void;
  certificateHref: string;
}) {
  const { t } = useTranslation();
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-ink-500/95 px-6"
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 28 }).map((_, i) => (
            <ConfettiPiece key={i} index={i} />
          ))}
        </div>

        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-sm rounded-brand-lg bg-white p-8 text-center shadow-2xl"
        >
          <div className="pointer-events-none absolute -right-16 -top-16 opacity-10">
            <SunWatermark size={220} />
          </div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 16 }}
            className="relative mx-auto flex size-16 items-center justify-center rounded-full bg-teal-500 text-white"
          >
            <Check className="size-8" strokeWidth={3} />
          </motion.div>

          <h2 className="relative mt-5 font-display text-2xl font-semibold text-ink-500">
            {t("thank_you")}, {signerName}!
          </h2>
          <p className="relative mt-2 text-sm text-ink-400">{t("celebration_body")}</p>

          <div className="relative mt-6 flex flex-col gap-2">
            <a
              href={certificateHref}
              className="inline-flex h-11 items-center justify-center rounded-brand-sm bg-orange-500 text-sm font-semibold text-white transition-colors duration-200 ease-brand hover:bg-orange-600"
            >
              {t("download_certificate_pdf")}
            </a>
            <Button variant="ghost" onClick={onClose}>
              {t("back_to_quote")}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
