"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const CONFETTI_COLORS = ["#CC7A3E", "#E9C04E", "#2991B4", "#5890B1"];
const SESSION_KEY = "kwotio_celebrated_requests";

function ConfettiPiece({ index }: { index: number }) {
  const left = (index * 41) % 100;
  const delay = (index % 8) * 0.05;
  const duration = 1.4 + (index % 4) * 0.25;
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const size = 5 + (index % 3) * 2;

  return (
    <motion.span
      initial={{ y: -20, opacity: 1, rotate: 0 }}
      animate={{ y: 220, opacity: [1, 1, 0], rotate: 200 }}
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

/**
 * Klein, terughoudend feestmomentje (niet de grote fullscreen-viering van
 * SuccessCelebration bij ondertekenen) — een korte confetti-uitbarsting
 * boven de paginatitel als er nieuwe, nog niet opgepakte aanvragen zijn.
 * Hoogstens één keer per dag per browser (sessionStorage), anders wordt het
 * al snel vervelend i.p.v. leuk.
 */
export function NewRequestsCelebration({ hasNewRequests }: { hasNewRequests: boolean }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!hasNewRequests) return;
    const today = new Date().toDateString();
    let alreadyCelebratedToday = false;
    try {
      alreadyCelebratedToday = sessionStorage.getItem(SESSION_KEY) === today;
      if (!alreadyCelebratedToday) sessionStorage.setItem(SESSION_KEY, today);
    } catch {
      // privé-modus e.d. — dan gewoon niet onthouden, geen harde eis
    }
    if (alreadyCelebratedToday) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShow(true);
    const timer = setTimeout(() => setShow(false), 1800);
    return () => clearTimeout(timer);
  }, [hasNewRequests]);

  if (!show) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-56 overflow-hidden">
      {Array.from({ length: 20 }).map((_, i) => (
        <ConfettiPiece key={i} index={i} />
      ))}
    </div>
  );
}
