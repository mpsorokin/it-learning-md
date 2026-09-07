import type { ReactNode } from "react";
import type { ReaderTheme } from "@/features/reading/readerTheme";

/**
 * The reading frame. `theme` only rebinds the `--r-*` aliases from
 * `styles/base.css`, so every rule in `components/reader.css` stays
 * theme-agnostic. The page around the card keeps the app's own dark colour in
 * both themes — a light card on a light page loses its edges.
 */
export function ReaderShell({ children, theme }: { children: ReactNode; theme: ReaderTheme }) {
  return (
    <div className="app-background">
      <div className={`reader-shell reader-shell--${theme}`}>{children}</div>
    </div>
  );
}
