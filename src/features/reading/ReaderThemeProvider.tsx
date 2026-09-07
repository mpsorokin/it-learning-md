import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { readReaderTheme, writeReaderTheme, type ReaderTheme } from "@/features/reading/readerTheme";

interface ReaderThemeValue {
  theme: ReaderTheme;
  setTheme: (theme: ReaderTheme) => void;
}

const ReaderThemeContext = createContext<ReaderThemeValue | null>(null);

export function ReaderThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ReaderTheme>(readReaderTheme);

  const setTheme = useCallback((next: ReaderTheme) => {
    setThemeState(next);
    writeReaderTheme(next);
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);
  return <ReaderThemeContext.Provider value={value}>{children}</ReaderThemeContext.Provider>;
}

export function useReaderTheme(): ReaderThemeValue {
  const value = useContext(ReaderThemeContext);
  if (!value) throw new Error("useReaderTheme must be used inside <ReaderThemeProvider>.");
  return value;
}
