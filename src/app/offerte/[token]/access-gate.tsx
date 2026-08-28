"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { SunWatermark } from "@/components/brand/sun-watermark";
import { Button } from "@/components/ui/button";
import { verifyAccessCode } from "./actions";
import { t, type Lang } from "@/lib/i18n/translations";

export function AccessGate({ token, lang }: { token: string; lang: Lang }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink-500 px-6">
      <div className="pointer-events-none absolute -right-20 -top-20 opacity-10">
        <SunWatermark size={420} />
      </div>

      <div className="relative w-full max-w-sm rounded-brand-lg bg-white p-8 text-center shadow-xl">
        <Logo variant="rond" height={64} className="mx-auto" />
        <div className="mx-auto mt-4 flex size-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <Lock className="size-5" />
        </div>
        <h1 className="mt-3 font-display text-xl font-semibold text-ink-500">{t("access_gate_title", lang)}</h1>
        <p className="mt-1 text-sm text-ink-400">{t("access_gate_subtitle", lang)}</p>

        <form
          className="mt-5 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            setError(false);
            startTransition(async () => {
              const ok = await verifyAccessCode(token, code.trim());
              if (ok) {
                router.refresh();
              } else {
                setError(true);
              }
            });
          }}
        >
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t("access_code_placeholder", lang)}
            autoFocus
            className="h-11 rounded-brand-sm border border-ink-200 bg-white px-3.5 text-center text-sm text-ink-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
          {error && <p className="text-sm text-red-600">{t("access_code_error", lang)}</p>}
          <Button type="submit" disabled={pending || !code.trim()}>
            {pending ? t("busy", lang) : t("view_quote", lang)}
          </Button>
        </form>
      </div>
    </div>
  );
}
