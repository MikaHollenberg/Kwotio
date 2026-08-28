import { Check, Loader2, AlertCircle } from "lucide-react";
import type { AutosaveStatus } from "@/hooks/use-autosave";
import { cn } from "@/lib/utils";

const CONFIG: Record<AutosaveStatus, { label: string; className: string; icon: React.ComponentType<{ className?: string }> | null }> = {
  idle: { label: "", className: "text-ink-300", icon: null },
  pending: { label: "Niet opgeslagen wijzigingen", className: "text-ink-400", icon: null },
  saving: { label: "Bezig met opslaan…", className: "text-ink-400", icon: Loader2 },
  saved: { label: "Opgeslagen", className: "text-teal-600", icon: Check },
  error: { label: "Opslaan mislukt", className: "text-red-600", icon: AlertCircle },
};

export function AutosaveIndicator({ status }: { status: AutosaveStatus }) {
  const { label, className, icon: Icon } = CONFIG[status];
  if (!label) return <span className="text-xs text-ink-300">&nbsp;</span>;

  return (
    <span className={cn("flex items-center gap-1.5 text-xs font-medium", className)}>
      {Icon && <Icon className={cn("size-3.5", status === "saving" && "animate-spin")} />}
      {label}
    </span>
  );
}
