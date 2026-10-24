import en from "./en.json";
import es from "./es.json";

export const locales = ["en", "es"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

/** English is the reference shape; Spanish must provide every key (checked by tsc and unit tests). */
export type Dictionary = typeof en;

const dictionaries: Record<Locale, Dictionary> = { en, es };

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

/** Maps any input to a supported locale. Unsupported or missing values fall back to the default. */
export function resolveLocale(value: string | null | undefined): Locale {
  const candidate = value?.trim().toLowerCase();
  return isLocale(candidate) ? candidate : defaultLocale;
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
