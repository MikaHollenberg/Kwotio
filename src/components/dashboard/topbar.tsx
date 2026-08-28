"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { MobileNav } from "./mobile-nav";

export function Topbar({
  title,
  fullName,
  email,
  showAdmin = false,
}: {
  title: string;
  fullName: string | null;
  email: string;
  showAdmin?: boolean;
}) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const initials = (fullName ?? email)
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  return (
    <header className="flex items-center justify-between gap-4 border-b border-ink-200/40 bg-sand-100/80 px-6 py-4 backdrop-blur-sm lg:px-8">
      <div className="flex items-center gap-3">
        <MobileNav showAdmin={showAdmin} />
        <h1 className="font-display text-xl font-semibold text-ink-500">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right text-sm sm:block">
          <div className="font-medium text-ink-500">{fullName ?? email}</div>
          <div className="text-ink-400">{email}</div>
        </div>
        <div className="flex size-9 items-center justify-center rounded-full bg-orange-500 text-sm font-semibold text-white">
          {initials || "?"}
        </div>
        <Button variant="ghost" size="sm" onClick={handleSignOut} title="Uitloggen">
          <LogOut className="size-4" />
        </Button>
      </div>
    </header>
  );
}
