export const LOCALES = ["es", "ca", "eu", "gl", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "es";
export const LOCALE_COOKIE = "lagun-locale";

/** Nombre de cada idioma en su propio idioma. */
export const LOCALE_NAMES: Record<Locale, string> = {
  es: "Castellano",
  ca: "Català",
  eu: "Euskara",
  gl: "Galego",
  en: "English",
};

/** Etiqueta para Intl (fechas). */
export const DATE_LOCALE: Record<Locale, string> = {
  es: "es-ES",
  ca: "ca-ES",
  eu: "eu-ES",
  gl: "gl-ES",
  en: "en-GB",
};

/** Nombre del idioma para las instrucciones de la IA. */
export const AI_LANGUAGE: Record<Locale, string> = {
  es: "castellano (español de España)",
  ca: "catalán",
  eu: "euskera",
  gl: "gallego",
  en: "inglés",
};

export function isLocale(x: unknown): x is Locale {
  return typeof x === "string" && (LOCALES as readonly string[]).includes(x);
}

/** Elige el mejor idioma a partir de la cabecera Accept-Language. */
export function matchAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) return DEFAULT_LOCALE;
  const prefs = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag: tag.toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { tag } of prefs) {
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}

/** Sustituye {variables} en una frase. */
export function fmt(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

/** Texto con una traducción por idioma (para datos de configuración). */
export type L10n = Record<Locale, string>;
export function pick(text: L10n, locale: Locale): string {
  return text[locale] ?? text.es;
}
