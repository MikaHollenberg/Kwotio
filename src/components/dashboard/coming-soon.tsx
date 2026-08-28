import { SunWatermark } from "@/components/brand/sun-watermark";
import { Card } from "@/components/ui/card";
import type { ThemeIconKey } from "@/components/brand/theme-icon";
import { ThemeIcon } from "@/components/brand/theme-icon";

export function ComingSoon({
  title,
  description,
  phase,
  icon = "zon",
}: {
  title: string;
  description: string;
  phase: string;
  icon?: ThemeIconKey;
}) {
  return (
    <Card className="relative flex min-h-[420px] flex-col items-center justify-center overflow-hidden px-6 py-16 text-center">
      <div className="pointer-events-none absolute -right-16 -top-16">
        <SunWatermark size={320} />
      </div>
      <ThemeIcon icon={icon} size={56} className="mb-5" />
      <h2 className="font-display text-2xl font-semibold text-ink-500">
        {title}
      </h2>
      <p className="mt-2 max-w-md text-sm text-ink-400">{description}</p>
      <span className="mt-5 inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
        Wordt gebouwd in {phase}
      </span>
    </Card>
  );
}
