import { clamp01 } from "@/lib/num";

interface ProgressBarProps {
  value: number;
  className?: string;
  /**
   * Accessible name. Omit it where the same number already sits in adjacent copy
   * ("4 / 7 done") — the bar is then decorative and is hidden from assistive tech
   * instead of announcing a second, unnamed progress indicator.
   */
  label?: string;
}

/**
 * Deliberately hook-free: the library screens render dozens of these, and a
 * `useTranslation()` in each one would subscribe every bar to language changes
 * just to produce a generic fallback name.
 */
export function ProgressBar({ value, className = "", label }: ProgressBarProps) {
  const normalized = clamp01(value);
  const semantics = label
    ? ({
        role: "progressbar",
        "aria-valuemin": 0,
        "aria-valuemax": 100,
        "aria-valuenow": Math.round(normalized * 100),
        "aria-label": label,
      } as const)
    : ({ "aria-hidden": true } as const);

  return (
    <div className={`progress-bar ${className}`} {...semantics}>
      <span style={{ width: `${normalized * 100}%` }} />
    </div>
  );
}
