import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Subtiel zon-watermark voor offerte-covers en lege staten (sectie 2.3).
 * Puur decoratief — altijd aria-hidden, nooit de enige drager van informatie.
 */
export function SunWatermark({
  className,
  size = 480,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <Image
      src="/brand/icoon-zon.png"
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className={cn("pointer-events-none select-none opacity-[0.07]", className)}
      style={{ width: size, height: size }}
    />
  );
}
