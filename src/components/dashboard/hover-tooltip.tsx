"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";

/** Portal-positioneerde hover-tooltip (fixed + getBoundingClientRect, zelfde
 * patroon als NotificationBell's paneel) i.p.v. een naïeve
 * position:absolute-tooltip -- die zou wegvallen zodra de trigger ergens
 * binnen een overflow-hidden-kaart staat (bv. de offertes-tabel), precies
 * het bekende stacking-context-probleem dat in dit project structureel
 * met een portal wordt opgelost. */
export function HoverTooltip({ children, content }: { children: React.ReactNode; content: React.ReactNode }) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  function show() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({ top: rect.top - 8, left: rect.left + rect.width / 2 });
  }

  function hide() {
    setPos(null);
  }

  return (
    <span ref={triggerRef} className="inline-flex" onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {pos &&
        createPortal(
          <div
            role="tooltip"
            className="kw-toast-in pointer-events-none fixed z-50 w-56 -translate-x-1/2 -translate-y-full rounded-brand-sm bg-ink-500 px-3 py-2 text-xs leading-relaxed text-white shadow-xl"
            style={{ top: pos.top, left: pos.left }}
          >
            {content}
          </div>,
          document.body,
        )}
    </span>
  );
}
