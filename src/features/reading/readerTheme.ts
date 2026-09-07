import { readStoredString, writeStoredString } from "@/lib/storage";

export const READER_THEME_STORAGE_KEY = "ittheory:reader-theme";

export type ReaderTheme = "dark" | "light";

export const READER_THEMES: readonly ReaderTheme[] = ["dark", "light"];

const isReaderTheme = (value: unknown): value is ReaderTheme =>
  value === "dark" || value === "light";

/** The app chrome is always dark; this only swaps the reading surface. */
export function readReaderTheme(): ReaderTheme {
  const stored = readStoredString(READER_THEME_STORAGE_KEY);
  return isReaderTheme(stored) ? stored : "dark";
}

export function writeReaderTheme(theme: ReaderTheme): void {
  writeStoredString(READER_THEME_STORAGE_KEY, theme);
}
