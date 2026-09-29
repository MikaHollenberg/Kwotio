"use client";

/** Wrapt één item in een lijst/grid die netjes moet krimpen (hoogte +
 * opacity) i.p.v. in één klap te verdwijnen zodra 'ie uit de lokale state
 * gehaald wordt -- gebruikt bij verwijderen/archiveren. `collapsed` zet de
 * transitie in gang; de aanroeper haalt het item pas ná de transitieduur
 * (`COLLAPSE_MS`) echt uit de array. */
export const COLLAPSE_MS = 260;

export function CollapsibleItem({ collapsed, children }: { collapsed: boolean; children: React.ReactNode }) {
  return (
    <div
      style={{
        maxHeight: collapsed ? 0 : 600,
        opacity: collapsed ? 0 : 1,
        transform: collapsed ? "scale(0.96)" : "scale(1)",
        marginBottom: collapsed ? 0 : undefined,
        overflow: "hidden",
        transition: `max-height ${COLLAPSE_MS}ms ease-brand, opacity ${COLLAPSE_MS}ms ease-brand, transform ${COLLAPSE_MS}ms ease-brand, margin-bottom ${COLLAPSE_MS}ms ease-brand`,
      }}
    >
      {children}
    </div>
  );
}
