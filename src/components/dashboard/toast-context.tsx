"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2 } from "lucide-react";

type Toast = { id: number; message: string };
type ToastContextValue = { showToast: (message: string) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

/** Korte bevestigingsmelding die van onderaf intekent i.p.v. een harde
 * alert() of een kleurveegje (Kwotio Motion Concepts #12). Eén gedeelde
 * provider (rond DashboardShell) i.p.v. per plek een eigen implementatie. */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast moet binnen ToastProvider gebruikt worden.");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const showToast = useCallback((message: string) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {typeof document !== "undefined" &&
        createPortal(
          <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex flex-col items-center gap-2 px-4">
            {toasts.map((toast) => (
              <div
                key={toast.id}
                className="kw-toast-in pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-full bg-ink-500 px-4 py-3 text-sm font-semibold text-white shadow-2xl"
              >
                <CheckCircle2 className="size-4 shrink-0 text-yellow-400" strokeWidth={2.4} />
                <span className="truncate">{toast.message}</span>
              </div>
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}
