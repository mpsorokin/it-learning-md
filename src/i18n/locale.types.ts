export const SUPPORTED_LOCALES = ["en", "ru"] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "en";

export const isAppLocale = (value: unknown): value is AppLocale =>
  typeof value === "string" && (SUPPORTED_LOCALES as readonly string[]).includes(value);
