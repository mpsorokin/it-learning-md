import { readStoredString, writeStoredString } from "@/lib/storage";
import { DEFAULT_LOCALE, isAppLocale, type AppLocale } from "@/i18n/locale.types";

export const LOCALE_STORAGE_KEY = "ittheory:locale";

export function readLocale(): AppLocale {
  const stored = readStoredString(LOCALE_STORAGE_KEY);
  return isAppLocale(stored) ? stored : DEFAULT_LOCALE;
}

export function writeLocale(locale: AppLocale): void {
  writeStoredString(LOCALE_STORAGE_KEY, locale);
}
