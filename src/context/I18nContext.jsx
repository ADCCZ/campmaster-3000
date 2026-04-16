import { createContext, useContext, useState, useCallback } from "react";
import cs from "../i18n/cs";
import en from "../i18n/en";

const TRANSLATIONS = { cs, en };
const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLang] = useState("cs");

  // t(key, ...args) — interpolates {0}, {1}, ... placeholders
  const t = useCallback(
    (key, ...args) => {
      let str = TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.cs[key] ?? key;
      args.forEach((arg, i) => {
        str = str.replace(`{${i}}`, String(arg));
      });
      return str;
    },
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
