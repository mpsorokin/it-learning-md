import type { CSSProperties } from "react";
import { progressSemantics } from "@/components/ui/progressSemantics";
import { clamp01 } from "@/lib/num";

interface ProgressRingProps {
  value: number;
  label: string;
}

/** Conic-gradient ring; the sweep is passed to CSS as `--progress-angle`. */
export function ProgressRing({ value, label }: ProgressRingProps) {
  const normalized = clamp01(value);
  return (
    <div
      className="progress-ring"
      style={{ "--progress-angle": `${normalized * 360}deg` } as CSSProperties}
      {...progressSemantics(normalized, label)}
    >
      <span className="progress-ring__inner">{Math.round(normalized * 100)}%</span>
    </div>
  );
}
