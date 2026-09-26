"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { PartyPopper } from "lucide-react";

const CONFETTI_COLORS = ["#B87F2A", "#E9C04E", "#2991B4", "#16A34A", "#CC7A3E"];

function ConfettiBit({ index }: { index: number }) {
  const angle = (index * 47) % 360;
  const dist = 34 + (index % 5) * 12;
  const rad = (angle * Math.PI) / 180;
  const dx = Math.cos(rad) * dist;
  const dy = Math.sin(rad) * dist - 8;
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];

  return (
    <motion.span
      initial={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
      animate={{ opacity: 0, x: dx, y: dy, rotate: angle }}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: 6,
        height: 9,
        borderRadius: 2,
        backgroundColor: color,
      }}
    />
  );
}

/** Klein, kort feestmoment (geen volledige takeover zoals SuccessCelebration
 * bij het ondertekenen door de klant) -- voor een mijlpaal aan de bureau-kant:
 * de 10e/50e/100e verstuurde offerte, of de eerste offerte voor een nieuwe
 * klant. Sluit zichzelf na een paar seconden. */
export function MilestoneCelebration({
  title,
  detail,
  onClose,
}: {
  title: string;
  detail: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const timeout = setTimeout(onClose, 4200);
    return () => clearTimeout(timeout);
  }, [onClose]);

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -14, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="fixed left-1/2 top-5 z-50 flex -translate-x-1/2 items-center gap-3 rounded-brand-lg border border-sand-300 bg-white px-4 py-3 shadow-xl"
      >
        <div className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-gold-50 text-gold-600">
          <PartyPopper className="size-4.5" />
          {Array.from({ length: 14 }).map((_, i) => (
            <ConfettiBit key={i} index={i} />
          ))}
        </div>
        <div>
          <p className="text-sm font-semibold text-ink-500">{title}</p>
          <p className="text-xs text-ink-400">{detail}</p>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
