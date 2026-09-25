/** Sorteert content-items op hun visuele positie (y, dan x) -- gebruikt
 * zowel voor de mobiele/tablet-weergave (die x/y negeert en gewoon alles
 * onder elkaar stapelt, in deze leesvolgorde) als overal waar de items in
 * hun bedoelde volgorde nodig zijn, los van de array-volgorde waarin ze
 * toevallig zijn opgeslagen. */
export function sortByLayout<T extends { y: number; x: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.y - b.y || a.x - b.x);
}

/** Clustert content-items in "rijen" voor renderomgevingen zonder echte
 * vrije 2D-plaatsing (de PDF, react-pdf kent geen CSS Grid/absolute
 * positionering) -- twee onderdelen komen in dezelfde PDF-rij zodra hun
 * verticale bereik (y tot y+hoogte) elkaar overlapt, ongeacht of ze precies
 * dezelfde y hebben. Dit reconstrueert een zinvolle, leesbare volgorde van
 * boven naar beneden uit de vrije y-posities die de editor oplevert. */
export function clusterIntoRows<T extends { y: number; x: number; height: number | null }>(
  items: T[],
  estimatedAutoHeight = 120,
): T[][] {
  const sorted = sortByLayout(items);
  const rows: T[][] = [];
  let rowBottom = -Infinity;
  for (const item of sorted) {
    const top = item.y;
    const bottom = item.y + (item.height ?? estimatedAutoHeight);
    if (rows.length === 0 || top >= rowBottom) {
      rows.push([item]);
      rowBottom = bottom;
    } else {
      rows[rows.length - 1].push(item);
      rowBottom = Math.max(rowBottom, bottom);
    }
  }
  return rows.map((row) => row.sort((a, b) => a.x - b.x));
}

type Rect = { left: number; right: number; top: number; bottom: number };

function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

/** Zoekt de dichtstbijzijnde geldige verticale positie (op of onder de
 * gevraagde `y`) waar `width`×`height` (in dezelfde eenheid als `others`)
 * NIET overlapt met een van de andere onderdelen op dezelfde x-baan --
 * "echt vrij beweegbaar maar nooit overlappend": je sleept ergens naartoe,
 * en het onderdeel zakt net zo ver als nodig is om vrij te komen te staan,
 * in plaats van vast te zitten aan een gedeelde rijhoogte. Simpele
 * "zwaartekracht"-aanpak: bots je tegen iets aan, zak dan tot net onder dat
 * obstakel en probeer opnieuw (met een cap tegen oneindige lussen). */
export function resolveCollisionY(
  left: number,
  requestedTop: number,
  width: number,
  height: number,
  others: Rect[],
  gap = 8,
): number {
  let top = Math.max(0, requestedTop);
  const rect = () => ({ left, right: left + width, top, bottom: top + height });
  for (let i = 0; i < 30; i++) {
    const current = rect();
    const collider = others.find((o) => rectsOverlap(current, o));
    if (!collider) return top;
    top = collider.bottom + gap;
  }
  return top;
}
