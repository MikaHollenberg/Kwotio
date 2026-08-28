"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Landt hier vanuit de link in de wachtwoord-hersteld-e-mail. Supabase kan de
 * sessie op twee manieren aanleveren (afhankelijk van de flow die de
 * link-aanmaak koos, empirisch niet altijd hetzelfde): als
 * access_token/refresh_token in het URL-fragment, of als `?code=` in de
 * query-string. Beide worden hier EXPLICIET verwerkt (setSession /
 * exchangeCodeForSession) i.p.v. te vertrouwen op automatische detectie
 * gevolgd door een kale getSession()-check — die bleek in de praktijk een
 * al bestaande sessie in dezelfde browser niet betrouwbaar te overschrijven,
 * waardoor het wachtwoord van de verkeerde (al ingelogde) gebruiker
 * gewijzigd kon worden. Eerst wordt daarom altijd expliciet uitgelogd, zodat
 * er nooit twijfel bestaat welke sessie hierna actief is.
 */
export function VerifyRecoveryLink() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function verify() {
      const code = new URLSearchParams(window.location.search).get("code");
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      await supabase.auth.signOut();

      let ok = false;
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        ok = !error;
      } else if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        ok = !error;
      }

      if (cancelled) return;
      router.replace(ok ? "/wachtwoord-herstellen/nieuw" : "/wachtwoord-vergeten?verlopen=1");
    }

    void verify();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="text-center">
      <p className="text-sm text-ink-400">Bezig met verifiëren…</p>
    </div>
  );
}
