"use client";

import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/lib/utils";

/** Laat het totaalbedrag vloeiend meebewegen bij wijzigingen (sectie 2.4). */
export function AnimatedPrice({
  amount,
  currency = "EUR",
  className,
}: {
  amount: number;
  currency?: string;
  className?: string;
}) {
  return (
    <span className={className} style={{ display: "inline-grid" }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={amount}
          initial={{ y: -10, opacity: 0, scale: 0.92 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 10, opacity: 0, scale: 0.92 }}
          transition={{ duration: 0.32, ease: [0.34, 1.56, 0.64, 1] }}
          style={{ gridArea: "1 / 1", display: "inline-block" }}
        >
          {formatCurrency(amount, currency)}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
