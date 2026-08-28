"use client";

import { createContext, useContext, useState } from "react";
import { t as translate, type Lang, type TranslationKey } from "./translations";

const LanguageContext = createContext<{ lang: Lang; setLang: (l: Lang) => void } | null>(null);

export function LanguageProvider({
  children,
  initialLang,
}: {
  children: React.ReactNode;
  initialLang: Lang;
}) {
  const [lang, setLang] = useState<Lang>(initialLang);
  return <LanguageContext.Provider value={{ lang, setLang }}>{children}</LanguageContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useTranslation must be used within a LanguageProvider");
  const { lang, setLang } = ctx;
  return { lang, setLang, t: (key: TranslationKey) => translate(key, lang) };
}
