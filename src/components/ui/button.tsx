import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ComponentProps } from "react";

const base =
  "inline-flex items-center justify-center gap-2 rounded-brand-sm font-semibold transition-all duration-200 ease-brand disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-500";

const variants = {
  primary:
    "bg-orange-500 text-white shadow-sm hover:bg-orange-600 active:bg-orange-700 focus-visible:ring-offset-sand-100",
  secondary:
    "bg-blue-500 text-white shadow-sm hover:bg-blue-600 active:bg-blue-700 focus-visible:ring-offset-sand-100",
  outline:
    "border border-ink-200 bg-transparent text-ink-500 hover:bg-sand-200 focus-visible:ring-offset-sand-100",
  ghost: "text-ink-500 hover:bg-sand-200 focus-visible:ring-offset-sand-100",
  subtle:
    "bg-blue-50 text-blue-700 hover:bg-blue-100 focus-visible:ring-offset-sand-100",
};

const sizes = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-base",
};

type ButtonOwnProps = {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonOwnProps & ComponentProps<"button">) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}

export function ButtonLink({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonOwnProps & ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}
