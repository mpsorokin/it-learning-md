import type { CSSProperties } from "react";

/** Conic-gradient ring; the sweep is passed to CSS as `--progress-angle`. */
export function ProgressRing({ value, label }: { value: number; label: string }) {
  const normalized = Math.min(1, Math.max(0, value));
  return (
    <div
      className="progress-ring"
      style={{ "--progress-angle": `${normalized * 360}deg` } as CSSProperties}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(normalized * 100)}
      aria-label={label}
    >
      <span className="progress-ring__inner">{Math.round(normalized * 100)}%</span>
    </div>
  );
}
