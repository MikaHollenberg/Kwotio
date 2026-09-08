import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "EUR") {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

/** Bouwt een wa.me-link uit een (meestal Nederlands) telefoonnummer —
 * wa.me vereist het internationale formaat zonder voorloopnul/plus/spaties. */
export function toWhatsAppLink(phone: string, text?: string): string {
  const digits = phone.replace(/[^0-9]/g, "");
  const international = digits.startsWith("0") ? `31${digits.slice(1)}` : digits;
  const query = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${international}${query}`;
}
