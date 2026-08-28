"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn, type AuthActionState } from "./actions";
import { Button } from "@/components/ui/button";

const initialState: AuthActionState = { error: null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const passwordChanged = searchParams.get("wachtwoord_gewijzigd") === "1";

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-ink-500">
        Welkom terug
      </h2>
      <p className="mt-1 text-sm text-ink-400">
        Log in op het Offerte-Portaal.
      </p>

      {passwordChanged && (
        <p className="mt-4 rounded-brand-sm bg-teal-50 px-3.5 py-2.5 text-sm text-teal-700">
          Je wachtwoord is gewijzigd. Log in met je nieuwe wachtwoord.
        </p>
      )}

      <form action={formAction} className="mt-8 flex flex-col gap-4">
        <input type="hidden" name="next" value={next} />

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

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-ink-500">
            Wachtwoord
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
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
          {pending ? "Bezig met inloggen…" : "Inloggen"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-400">
        <Link href="/wachtwoord-vergeten" className="font-medium text-teal-600 hover:text-teal-700">
          Wachtwoord vergeten?
        </Link>
      </p>
    </div>
  );
}
