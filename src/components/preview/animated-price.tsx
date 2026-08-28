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
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 10, opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          style={{ gridArea: "1 / 1" }}
        >
          {formatCurrency(amount, currency)}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
