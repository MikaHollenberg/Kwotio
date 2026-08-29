"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ShieldCheck } from "lucide-react";
import { NAV_ITEMS } from "./sidebar";
import { cn } from "@/lib/utils";

export function MobileNav({ showAdmin = false }: { showAdmin?: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-brand-sm p-2 text-ink-400 hover:bg-sand-200 lg:hidden"
      >
        <Menu className="size-5" />
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div className="fixed inset-0 bg-ink-500/50" onClick={() => setOpen(false)} />

            <div className="relative flex w-72 max-w-[80vw] flex-col bg-white px-4 py-6 shadow-xl">
              <div className="mb-6 flex items-center justify-between px-2">
                <span className="font-display text-lg font-semibold text-ink-500">Menu</span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex size-8 items-center justify-center rounded-brand-sm text-ink-400 hover:bg-sand-200"
                >
                  <X className="size-5" />
                </button>
              </div>

              <nav className="flex flex-1 flex-col gap-1">
                {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                  const isActive = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-brand-sm px-3 py-2.5 text-sm font-medium text-ink-400 transition-colors duration-200 ease-brand hover:bg-sand-200 hover:text-ink-500",
                        isActive && "bg-blue-500 text-white hover:bg-blue-500 hover:text-white",
                      )}
                    >
                      <Icon className="size-4.5" strokeWidth={2} />
                      {label}
                    </Link>
                  );
                })}
              </nav>

              {showAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-brand-sm border border-ink-200/60 px-3 py-2.5 text-sm font-medium text-ink-500 transition-colors duration-200 ease-brand hover:bg-sand-200"
                >
                  <ShieldCheck className="size-4.5" strokeWidth={2} />
                  Hoofdaccount
                </Link>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
