"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { requestPasswordReset, type ForgotPasswordState } from "./actions";
import { Button } from "@/components/ui/button";

const initialState: ForgotPasswordState = { message: null };

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialState);
  const searchParams = useSearchParams();
  const expired = searchParams.get("verlopen") === "1";

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-ink-500">
        Wachtwoord vergeten
      </h2>
      <p className="mt-1 text-sm text-ink-400">
        Vul je e-mailadres in, dan sturen we je instructies om een nieuw wachtwoord in te stellen.
      </p>

      {expired && !state.message && (
        <p className="mt-4 rounded-brand-sm bg-yellow-100 px-3.5 py-2.5 text-sm text-yellow-800">
          Deze link is verlopen of al gebruikt. Vraag hieronder een nieuwe aan.
        </p>
      )}

      <form action={formAction} className="mt-8 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-ink-500">
            E-mailadres
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="h-11 rounded-brand-sm border border-ink-200 bg-white px-3.5 text-sm text-ink-500 outline-none transition-colors duration-200 ease-brand placeholder:text-ink-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            placeholder="jij@feestaanhetwater.nl"
          />
        </div>

        {state.message && (
          <p className="rounded-brand-sm bg-teal-50 px-3.5 py-2.5 text-sm text-teal-700">
            {state.message}
          </p>
        )}

        <Button type="submit" disabled={pending} className="mt-2 w-full">
          {pending ? "Bezig…" : "Verstuur instructies"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-400">
        <Link href="/login" className="font-medium text-teal-600 hover:text-teal-700">
          Terug naar inloggen
        </Link>
      </p>
    </div>
  );
}
