"use client";

import { useActionState } from "react";
import { updatePassword, type UpdatePasswordState } from "./actions";
import { Button } from "@/components/ui/button";

const initialState: UpdatePasswordState = { error: null };

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(updatePassword, initialState);

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-ink-500">
        Nieuw wachtwoord instellen
      </h2>
      <p className="mt-1 text-sm text-ink-400">
        Kies een nieuw, uniek wachtwoord van minimaal 8 tekens.
      </p>

      <form action={formAction} className="mt-8 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-ink-500">
            Nieuw wachtwoord
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="h-11 rounded-brand-sm border border-ink-200 bg-white px-3.5 text-sm text-ink-500 outline-none transition-colors duration-200 ease-brand placeholder:text-ink-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            placeholder="••••••••"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="passwordRepeat" className="text-sm font-medium text-ink-500">
            Herhaal wachtwoord
          </label>
          <input
            id="passwordRepeat"
            name="passwordRepeat"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="h-11 rounded-brand-sm border border-ink-200 bg-white px-3.5 text-sm text-ink-500 outline-none transition-colors duration-200 ease-brand placeholder:text-ink-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            placeholder="••••••••"
          />
        </div>

        {state.error && (
          <p className="rounded-brand-sm bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {state.error}
          </p>
        )}

        <Button type="submit" disabled={pending} className="mt-2 w-full">
          {pending ? "Bezig…" : "Wachtwoord wijzigen"}
        </Button>
      </form>
    </div>
  );
}
