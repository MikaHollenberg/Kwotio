"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { LogoPreference } from "@/lib/types/database";
import { updateOrganizationLogoPreference } from "../actions";

export function OrganizationLogoPreference({
  organizationId,
  initialPreference,
}: {
  organizationId: string;
  initialPreference: LogoPreference;
}) {
  const [preference, setPreference] = useState(initialPreference);

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-ink-400">
        Hoofdlogo op offertes &amp; PDF&apos;s (de menubalk toont altijd het horizontale logo)
      </span>
      <div className="inline-flex w-fit rounded-brand-sm border border-ink-200/60 bg-white p-0.5 text-xs font-medium">
        {(["horizontaal", "vierkant"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => {
              setPreference(option);
              void updateOrganizationLogoPreference(organizationId, option);
            }}
            className={cn(
              "rounded-[calc(var(--radius-brand-sm)_-_2px)] px-3 py-1.5 capitalize transition-colors",
              preference === option ? "bg-teal-500 text-white" : "text-ink-400 hover:text-ink-500",
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
