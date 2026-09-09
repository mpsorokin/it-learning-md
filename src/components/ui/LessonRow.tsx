import { Check } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface LessonRowProps {
  to: string;
  title: string;
  index: number;
  done: boolean;
  ratio: number;
  /** Accessible name for the reading-progress bar. */
  progressLabel: string;
  completedLabel: string;
}

/**
 * One lesson card on the folder screen. Hook-free for the same reason as
 * `ContentRow` — the caller already has translated strings in hand.
 */
export function LessonRow({ to, title, index, done, ratio, progressLabel, completedLabel }: LessonRowProps) {
  return (
    <Link className={`lesson-row ${done ? "lesson-row--done" : ""}`} to={to}>
      <span className="lesson-row__mark" aria-hidden="true">
        {done ? <Check size={13} weight="bold" /> : String(index + 1).padStart(2, "0")}
      </span>
      <div className="lesson-row__body">
        <span className="lesson-row__title">{title}</span>
        <ProgressBar value={ratio} label={progressLabel} />
      </div>
      {done && <span className="visually-hidden">{completedLabel}</span>}
    </Link>
  );
}
