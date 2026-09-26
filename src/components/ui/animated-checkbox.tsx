"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/** Vervangt een kale `<input type="checkbox">` visueel: het vinkje tekent
 * zichzelf in (stroke-dashoffset-transitie) i.p.v. in één keer te
 * verschijnen, met een korte `kw-bump`-overshoot op het vakje. De echte
 * `<input>` blijft aanwezig (onzichtbaar, volledig klikbaar) voor
 * toetsenbord-/screenreadertoegankelijkheid. */
export function AnimatedCheckbox({
  checked,
  onChange,
  disabled,
  accentColor = "#257da0",
  className,
}: {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  accentColor?: string;
  className?: string;
}) {
  const id = useId();
  return (
    <span className={cn("relative inline-flex size-5 shrink-0 items-center justify-center", className)}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange ? (e) => onChange(e.target.checked) : undefined}
        className="peer absolute inset-0 z-10 size-5 cursor-pointer opacity-0 disabled:cursor-default"
      />
      <span
        aria-hidden="true"
        data-checked={checked}
        style={{
          borderColor: checked ? accentColor : undefined,
          backgroundColor: checked ? accentColor : "transparent",
        }}
        className={cn(
          "kw-check-box pointer-events-none flex size-5 items-center justify-center rounded-[6px] border-2 border-ink-200 peer-disabled:opacity-100",
          checked && "kw-bump",
        )}
      >
        <svg viewBox="0 0 16 16" className="size-3">
          <path
            d="M3 8.5L6.2 11.7L13 4.5"
            fill="none"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={checked ? 0 : 1}
            className="kw-check-path"
          />
        </svg>
      </span>
    </span>
  );
}
