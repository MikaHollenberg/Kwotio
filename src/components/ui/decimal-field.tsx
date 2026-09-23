import { useState } from "react";

/**
 * Vrij intypbaar bedrag/getal-veld -- nooit een kaal `type="number"`: dat
 * herschrijft `value` bij elke toetsaanslag naar de geparste/afgeronde
 * waarde, waardoor de cursor bij het intypen van decimalen (vooral met een
 * komma) naar het einde springt en spinner-pijltjes niet te verwijderen
 * zijn (hard geleerde les uit de factuurmodule, zie line-items-editor.tsx).
 * Lokale tekst-state die nooit vanuit `value` terugsynct -- alleen
 * `onCommit` volgt wat je typt. Reset bewust alleen via een andere React
 * `key` op de instantie.
 */
export function DecimalField({
  value,
  onCommit,
  className,
  title,
  placeholder,
}: {
  value: number;
  onCommit: (n: number) => void;
  className?: string;
  title?: string;
  placeholder?: string;
}) {
  const [text, setText] = useState(() => String(value).replace(".", ","));

  return (
    <input
      type="text"
      inputMode="decimal"
      value={text}
      placeholder={placeholder}
      title={title}
      className={className}
      onChange={(e) => {
        const raw = e.target.value;
        setText(raw);
        const normalized = raw.replace(",", ".").trim();
        if (normalized === "" || normalized === "-") return;
        const parsed = Number(normalized);
        if (Number.isFinite(parsed)) onCommit(parsed);
      }}
    />
  );
}
