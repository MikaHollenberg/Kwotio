import { Suspense } from "react";
import type { Metadata } from "next";
import { VerifyRecoveryLink } from "./verify-recovery-link";

export const metadata: Metadata = { title: "Wachtwoord herstellen" };

export default function WachtwoordHerstellenPage() {
  return (
    <Suspense>
      <VerifyRecoveryLink />
    </Suspense>
  );
}
