"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Lichte 3D-kanteling die de muispositie volgt op hover -- puur cosmetisch
 * (geen state, alleen een directe stijl-update op het element zelf), voor
 * een premium SaaS-gevoel op de dashboard-KPI-tegels. De ouder-grid heeft
 * `perspective` nodig (`[perspective:800px]`) om het effect zichtbaar te
 * maken. */
export function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    e.currentTarget.style.transform = `rotateY(${px * 8}deg) rotateX(${-py * 8}deg) scale(1.015)`;
  }

  function handleMouseLeave(e: React.MouseEvent<HTMLDivElement>) {
    e.currentTarget.style.transform = "";
  }

  return (
    <Card
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "[transform-style:preserve-3d] transition-transform duration-200 ease-brand will-change-transform",
        className,
      )}
    >
      <CardContent className="flex items-center gap-4">{children}</CardContent>
    </Card>
  );
}
