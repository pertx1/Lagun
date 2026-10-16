"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Dict } from "./dict/es";
import { DATE_LOCALE, fmt, type Locale } from "./config";

const Ctx = createContext<{ locale: Locale; t: Dict } | null>(null);

export function I18nProvider({ locale, dict, children }: { locale: Locale; dict: Dict; children: ReactNode }) {
  return <Ctx.Provider value={{ locale, t: dict }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useI18n fuera de I18nProvider");
  return { ...v, f: fmt, dateLocale: DATE_LOCALE[v.locale] };
}
