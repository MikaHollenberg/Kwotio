"use client";

import { useEffect, useRef, useState } from "react";

export type AutosaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

/** Debounced autosave: roept `save(value)` aan ~1s nadat wijzigingen stoppen. */
export function useAutosave<T>(value: T, save: (value: T) => Promise<void>, delay = 1000) {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const isFirstRun = useRef(true);
  const savedRef = useRef(value);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      savedRef.current = value;
      return;
    }

    if (JSON.stringify(value) === JSON.stringify(savedRef.current)) return;

    setStatus("pending");
    const timeout = setTimeout(async () => {
      setStatus("saving");
      try {
        await save(value);
        savedRef.current = value;
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    }, delay);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, delay]);

  return status;
}
