import { KwotioMark } from "@/components/brand/kwotio-mark";

type Placement = { top: string; left: string; size: number; rotate: number; opacity: number };

/** Zelfde verspreidingspatroon/dichtheid als het eerdere (Caribbean
 * Bar-)achtergrondpatroon op het linkerpaneel van het inlogscherm, nu met
 * het Kwotio-merkteken herhaald i.p.v. wisselende thema-iconen. */
const PLACEMENTS: Placement[] = [
  { top: "6%", left: "68%", size: 72, rotate: -8, opacity: 0.16 },
  { top: "16%", left: "12%", size: 56, rotate: 10, opacity: 0.12 },
  { top: "32%", left: "80%", size: 44, rotate: -14, opacity: 0.14 },
  { top: "48%", left: "6%", size: 60, rotate: 6, opacity: 0.1 },
  { top: "58%", left: "58%", size: 38, rotate: 18, opacity: 0.1 },
  { top: "72%", left: "84%", size: 50, rotate: -6, opacity: 0.13 },
  { top: "84%", left: "22%", size: 46, rotate: 8, opacity: 0.15 },
  { top: "94%", left: "70%", size: 64, rotate: -20, opacity: 0.12 },
  { top: "2%", left: "38%", size: 34, rotate: -4, opacity: 0.1 },
];

export function KwotioIconScatter() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {PLACEMENTS.map((p, i) => (
        <div
          key={i}
          className="absolute"
          style={{ top: p.top, left: p.left, transform: `rotate(${p.rotate}deg)`, opacity: p.opacity }}
        >
          <KwotioMark size={p.size} />
        </div>
      ))}
    </div>
  );
}
